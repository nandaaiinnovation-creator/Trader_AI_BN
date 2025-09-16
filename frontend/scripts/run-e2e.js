#!/usr/bin/env node
/**
 * Cross-platform E2E orchestrator for frontend tests.
 * Usage: node ./scripts/run-e2e.js [--headless]
 * - starts the test socket server
 * - runs `npx cypress run` (headless) or `npx cypress open` with --headed
 * - tears down the test server on exit
 */

const { spawn, execSync } = require('child_process')
const path = require('path')
const http = require('http')

function spawnProcess(command, args, opts = {}){
  try {
    console.log('Spawning:', command, args && args.join(' '))
    const proc = spawn(command, args, Object.assign({ stdio: 'inherit' }, opts))
    proc.on('error', (err) => console.error(`Process ${command} error:`, err))
    return proc
  } catch (err) {
    // fallback: spawn via shell with a single command string (works around some Windows EINVAL spawn issues)
    try {
      const cmdStr = [command].concat(args || []).join(' ')
      console.warn('spawn failed, falling back to shell spawn:', cmdStr, err && err.message)
      const proc = spawn(cmdStr, Object.assign({ stdio: 'inherit', shell: true }, opts))
      proc.on('error', (e) => console.error('Shell spawn error:', e))
      return proc
    } catch (e) {
      console.error('Failed to spawn process even with shell fallback:', e)
      throw e
    }
  }
}

function waitForUrl(url, timeout = 20000){
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume()
        resolve(true)
      })
      req.on('error', (err) => {
        if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for ' + url))
        setTimeout(check, 500)
      })
    }
    check()
  })
}

async function run(){
  const root = path.resolve(__dirname, '..')
  const serverScript = path.join(root, 'cypress', 'support', 'test-server.js')

  const argv = process.argv.slice(2)
  const noDev = argv.includes('--no-dev')
  const headed = argv.includes('--headed')
  const showLock = argv.includes('--show-lock')
  const dryRun = argv.includes('--dry-run')
  const force = argv.includes('--force')
  const skipInstall = argv.includes('--skip-install')

  if (argv.includes('--help') || argv.includes('-h')){
    console.log('Usage: node scripts/run-e2e.js [--no-dev] [--headed] [--dry-run] [--show-lock]')
    process.exit(0)
  }

  const fs = require('fs')
  const os = require('os')

  console.log('E2E orchestrator starting (root=', root, ')')

  // prepare artifacts directory (timestamped) to capture logs/screenshots/videos
  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const artifactsDir = path.join(root, 'e2e-artifacts', now)
  const serverLogPath = path.join(artifactsDir, 'test-server.log')
  const serverErrPath = path.join(artifactsDir, 'test-server.err')
  const devLogPath = path.join(artifactsDir, 'dev-server.log')
  const cypressVideos = path.join(artifactsDir, 'cypress', 'videos')
  const cypressShots = path.join(artifactsDir, 'cypress', 'screenshots')

  if (dryRun){
    console.log('[dry-run] Plan:')
    console.log('[dry-run]  - start test socket server: node', serverScript)
    if (!noDev) console.log('[dry-run]  - start frontend dev server: npm run dev')
    else console.log('[dry-run]  - skip frontend dev server (--no-dev)')
    console.log('[dry-run]  - run Cypress', headed ? '(open/headed)' : '(run/headless)')
    console.log('[dry-run]  - teardown servers after Cypress completes')
    console.log('[dry-run]  - artifacts dir:', artifactsDir)
    process.exit(0)
  }

  if (showLock){
    // delegate to the small helper to print nicely
    try {
      const spawnSync = require('child_process').spawnSync
      const node = process.execPath || 'node'
      const helper = path.join(root, 'scripts', 'show-e2e-lock.js')
      const res = spawnSync(node, [helper], { cwd: root, stdio: 'inherit' })
      process.exit(res.status || 0)
    } catch (e) {
      console.error('Failed to run show-e2e-lock helper:', e && e.message)
      process.exit(1)
    }
  }

  // Ensure dependencies are present before starting servers (install once)
  try {
    const cypressModulePath = path.join(root, 'node_modules', 'cypress')
    if (!fs.existsSync(cypressModulePath)){
      if (skipInstall){
        console.error('Dependencies missing (cypress not found) and --skip-install was provided. Please run `npm ci` in the frontend folder and re-run this script.')
        process.exit(1)
      }
      console.log('Cypress not found in node_modules — running `npm ci` to install deps (this may take a while)')
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

      // Helper: try to relocate a possibly locked esbuild binary so npm can replace it.
      function tryRelocateEsbuildOnce(){
        try {
          if (process.platform !== 'win32') return false
          const ebPath = path.join(root, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe')
          if (!fs.existsSync(ebPath)) return false
          const lockedPath = ebPath + '.locked'
          console.warn('Found existing esbuild binary at', ebPath, '- attempting to rename to', lockedPath, 'to allow reinstall')
          try {
            fs.renameSync(ebPath, lockedPath)
            console.warn('Renamed esbuild binary to', lockedPath)
            return true
          } catch (re) {
            console.warn('Failed to rename esbuild binary:', re && re.message)
            return false
          }
        } catch (err) {
          return false
        }
      }

      // Preflight: if an esbuild binary exists (Windows), try to rename it before attempting `npm ci`.
      try {
        tryRelocateEsbuildOnce()
      } catch (pf) {
        // ignore preflight failures — we'll still try `npm ci` and provide guidance on errors
      }

      try {
        // execSync is synchronous and often more robust for simple CI installs on Windows
        execSync(`${npmCmd} ci`, { cwd: root, stdio: 'inherit', shell: true })
        console.log('`npm ci` completed')
      } catch (e) {
        console.error('`npm ci` failed. Common causes: file locks (esbuild.exe), insufficient permissions, or antivirus.\nPlease run `npm ci` manually in the frontend folder and fix any issues, then re-run this orchestrator.')
        // provide hint about admin rights and skip-install
        console.error('Hint: on Windows you may need to close editors/terminals or run PowerShell as Administrator to allow replacing native binaries. Alternatively run this script with --skip-install after running `npm ci` manually.')
        throw e
      }
    }
  } catch (e) {
    console.error('Dependency installation error:', e && e.message)
    process.exit(1)
  }

  // If dry-run, print planned actions and exit without starting processes
  if (dryRun){
    console.log('[dry-run] Plan:')
    console.log('[dry-run]  - start test socket server: node', serverScript)
    if (!noDev) console.log('[dry-run]  - start frontend dev server: npm run dev')
    else console.log('[dry-run]  - skip frontend dev server (--no-dev)')
    console.log('[dry-run]  - run Cypress', headed ? '(open/headed)' : '(run/headless)')
    console.log('[dry-run]  - teardown servers after Cypress completes')
    process.exit(0)
  }

  // start test socket server
  // ensure artifacts dir exists
  fs.mkdirSync(artifactsDir, { recursive: true })

  // Create a lockfile to prevent concurrent runs. If a stale lock exists (older than TTL) override it.
  const lockFile = path.join(root, 'e2e.lock')
  const LOCK_TTL_MS = parseInt(process.env.E2E_LOCK_TTL_MS || String(1000 * 60 * 30), 10) // default 30 minutes
  try {
    function isPidAlive(pid){
      try {
        // signal 0 only tests for existence of a process
        process.kill(pid, 0)
        return true
      } catch (err) {
        // ESRCH = no such process; EPERM = process exists but no permission to signal
        if (err && err.code === 'ESRCH') return false
        if (err && err.code === 'EPERM') return true
        return false
      }
    }

    if (fs.existsSync(lockFile)){
      try {
        const stat = fs.statSync(lockFile)
        const age = Date.now() - stat.mtimeMs
        const raw = fs.readFileSync(lockFile, 'utf8')
        let parsed = null
        try {
          parsed = JSON.parse(raw)
        } catch (pe) {
          console.warn('Existing lockfile is not valid JSON; treating as stale if older than TTL')
        }
        // If the lockfile contains a PID and it's on the same host, check liveness
        let pidAlive = false
        if (parsed && parsed.pid && parsed.host === os.hostname()){
          try {
            pidAlive = isPidAlive(Number(parsed.pid))
          } catch (pe) {
            pidAlive = false
          }
        }

        if (pidAlive) {
          if (!force) {
            console.error('Another E2E run appears to be active (lockfile found, PID alive):', parsed)
            console.error('If this is stale, remove the lockfile, or run with --force to override.')
            process.exit(1)
          } else {
            console.warn('`--force` provided: overriding existing active PID lockfile', parsed)
          }
        } else {
          // PID not alive or no PID info; fall back to TTL check
          if (age > LOCK_TTL_MS) {
            console.warn(`Found stale lockfile (age=${Math.round(age/1000)}s) - overriding`, parsed || raw)
          } else if (force) {
            console.warn('`--force` provided: overriding existing lockfile', parsed || raw)
          } else if (!parsed || !parsed.pid) {
            console.error('Another E2E run appears to be active (lockfile found):', parsed || raw)
            console.error(`If this is stale, remove ${lockFile}, set E2E_LOCK_TTL_MS to a smaller value, or run with --force to override.`)
            process.exit(1)
          } else {
            // PID not alive but lock is within TTL - allow override (it's likely stale)
            console.warn('Lockfile PID not running; overriding lockfile', parsed || raw)
          }
        }
      } catch (re) {
        console.warn('Could not read existing lockfile metadata, attempting to acquire lock anyway')
      }
    }
    const lockMeta = {
      pid: process.pid,
      createdAt: new Date().toISOString(),
      host: os.hostname()
    }
    fs.writeFileSync(lockFile, JSON.stringify(lockMeta), { flag: 'w' })
    console.log('Created lockfile:', lockFile, JSON.stringify(lockMeta))
  } catch (e) {
    console.error('Unable to create lockfile, aborting to avoid concurrent runs:', e && e.message)
    process.exit(1)
  }

  console.log('Starting test socket server...')
  const node = process.execPath || 'node'
  // spawn server with piped stdio so we can capture logs
  const server = spawn(node, [serverScript], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  const serverOut = fs.createWriteStream(serverLogPath, { flags: 'a' })
  const serverErr = fs.createWriteStream(serverErrPath, { flags: 'a' })
  if (server.stdout) server.stdout.pipe(serverOut)
  if (server.stderr) server.stderr.pipe(serverErr)

  // Start a simple poll-based tailer for the server log so CI step output shows
  // live progress while we wait for the health endpoint. This is intentionally
  // lightweight (no external deps) and works on Windows runners.
  function startLogTail(filePath, prefix = '[server-log]'){
    let offset = 0
    let stopped = false
    const pollMs = 1000
    const pump = () => {
      if (stopped) return
      try {
        if (!fs.existsSync(filePath)) return
        const stat = fs.statSync(filePath)
        if (stat.size > offset){
          const rs = fs.createReadStream(filePath, { start: offset, end: stat.size - 1, encoding: 'utf8' })
          rs.on('data', (chunk) => {
            // prefix each chunk so it's clear in CI logs
            process.stdout.write(`${prefix} ${chunk}`)
          })
          rs.on('end', () => { offset = stat.size })
        }
      } catch (e) {
        // best-effort: don't crash orchestrator if tailing fails
        // write a single-line warning and stop trying if repeated errors occur
        process.stdout.write(`[run-e2e] log tail error: ${e && e.message}\n`)
      }
    }
    const handle = setInterval(pump, pollMs)
    // run immediately once
    pump()
    return { stop: () => { stopped = true; clearInterval(handle) } }
  }

  // optionally start the frontend dev server (vite)
  let devProc = null
  if (!noDev){
    console.log('Starting frontend dev server (npm run dev)...')
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    // try a direct spawn first; on some Windows setups spawn may throw EINVAL
    try {
      devProc = spawn(npmCmd, ['run', 'dev'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (err) {
      console.warn('spawn direct npm failed, falling back to shell spawn:', err && err.message)
      // fallback to shell mode (works around some Windows path/shell quirks)
      devProc = spawn(`${npmCmd} run dev`, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: true })
    }
    const devOut = fs.createWriteStream(devLogPath, { flags: 'a' })
    if (devProc.stdout) devProc.stdout.pipe(devOut)
    if (devProc.stderr) devProc.stderr.pipe(devOut)
  }

  // helper to teardown both processes
  async function teardown(){
    try {
      if (devProc && !devProc.killed) devProc.kill()
    } catch (e) {}
    try {
      if (server && !server.killed) server.kill()
    } catch (e) {}
    try {
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile)
    } catch (e) {
      console.warn('Failed to remove lockfile:', e && e.message)
    }
  }

  process.on('SIGINT', async () => { await teardown(); process.exit(0) })
  process.on('SIGTERM', async () => { await teardown(); process.exit(0) })

  // wait briefly for the test server to start and respond to health
  // give the server a little more time to initialize on CI hosts
  await new Promise(r => setTimeout(r, 1500))

  // Start tailing the server log so CI shows progress while we wait for health
  const serverTail = startLogTail(serverLogPath, '[test-server]')

  // wait for test server health endpoint
  try {
    console.log('Waiting for test server health at http://localhost:4001/health')
    // increase to 30s on CI to reduce flakiness on slower runners
    await waitForUrl('http://localhost:4001/health', 30000)
    console.log('Test server ready')
    // stop tailing once healthy
    try { serverTail.stop() } catch (e) {}
  } catch (err) {
    console.warn('Test server did not become ready:', err.message)
    // collect diagnostics: dump tail of server & dev logs to help triage flaky startups
    try {
      const diagPath = path.join(artifactsDir, 'diagnostics.txt')
      const linesToDump = 200
      let out = []
      out.push('--- Test server health check failed: ' + new Date().toISOString() + '\n')
      out.push('Health check error: ' + (err && err.message) + '\n')
      out.push('Server PID: ' + (server && server.pid) + '\n')
      if (fs.existsSync(serverLogPath)){
        try {
          const s = fs.readFileSync(serverLogPath, 'utf8').split(/\r?\n/)
          out.push('\n=== Last ' + linesToDump + ' lines of test server stdout/stderr ===\n')
          out.push(s.slice(-linesToDump).join('\n'))
        } catch (re) {
          out.push('\nFailed to read server log: ' + re.message + '\n')
        }
      } else {
        out.push('\nNo server log found at ' + serverLogPath + '\n')
      }
      if (fs.existsSync(devLogPath)){
        try {
          const d = fs.readFileSync(devLogPath, 'utf8').split(/\r?\n/)
          out.push('\n=== Last ' + linesToDump + ' lines of dev server log ===\n')
          out.push(d.slice(-linesToDump).join('\n'))
        } catch (re) {
          out.push('\nFailed to read dev log: ' + re.message + '\n')
        }
      } else {
        out.push('\nNo dev log found at ' + devLogPath + '\n')
      }
      try { fs.writeFileSync(diagPath, out.join('\n'), 'utf8') } catch (we) { console.warn('Failed to write diagnostics file:', we && we.message) }
      console.warn('Wrote diagnostics to:', path.join(artifactsDir, 'diagnostics.txt'))
    } catch (diagErr) {
      console.warn('Failed to collect diagnostics:', diagErr && diagErr.message)
    }
    // ensure tailer stopped
    try { serverTail.stop() } catch (e) {}
  }

  // wait for frontend to be ready (if started)
  if (!noDev){
    const url = 'http://localhost:5173/'
    console.log('Waiting for frontend dev server to become available at', url)
    try { await waitForUrl(url, 30000); console.log('Frontend dev server ready') } catch (err){ console.warn('Frontend did not become ready in time:', err.message) }
  }

  if (dryRun){
    console.log('[dry-run] E2E orchestrator would now run Cypress and then teardown')
    await teardown()
    process.exit(0)
  }

  try {
    // run Cypress; direct videos/screenshots into artifacts dir so CI can collect them
  const videosFolder = path.relative(root, cypressVideos)
  const screenshotsFolder = path.relative(root, cypressShots)
  fs.mkdirSync(cypressVideos, { recursive: true })
  fs.mkdirSync(cypressShots, { recursive: true })

  const cypressArgs = headed ? ['cypress', 'open'] : ['cypress', 'run', '--config', `videosFolder=${videosFolder},screenshotsFolder=${screenshotsFolder}`]
  console.log('Running Cypress', headed ? '(headed/open)' : `(headless/run) -> videos=${videosFolder} screenshots=${screenshotsFolder}`)
  // Ensure we only spawn Cypress once (defensive)
  let cypressLaunched = false
  if (!cypressLaunched){
    console.log('Spawning Cypress runner now...')
    cypressLaunched = true
    const runner = spawnProcess(process.platform === 'win32' ? 'npx.cmd' : 'npx', cypressArgs, { cwd: root })
    await new Promise((resolve, reject) => {
      runner.on('exit', (code) => {
        console.log('Cypress runner exited with code', code)
        return code === 0 ? resolve() : reject(new Error('Cypress failed with code ' + code))
      })
    })
    console.log('Cypress finished successfully')
  } else {
    console.warn('Cypress runner was already launched; skipping second spawn')
  }
  } catch (err){
    console.error('E2E run failed:', err)
    await teardown()
    throw err
  }
  await teardown()

  // Exit explicitly to avoid lingering event listeners or child-process side-effects
  console.log('Teardown complete; exiting orchestrator process')
  // Zip artifacts for CI consumption (best-effort)
  try {
    const archiver = require('archiver')
    const outPath = path.join(root, `e2e-artifacts-${now}.zip`)
    const output = fs.createWriteStream(outPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => console.log('Created artifact zip:', outPath, archive.pointer(), 'bytes'))
    archive.on('error', (err) => { throw err })
    archive.pipe(output)
    archive.directory(artifactsDir, false)
    await archive.finalize()
  } catch (e) {
    console.warn('Could not create artifacts zip (archiver missing or failed):', e && e.message)
    console.warn('CI jobs can still upload the artifacts directory directly')
  }

  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
