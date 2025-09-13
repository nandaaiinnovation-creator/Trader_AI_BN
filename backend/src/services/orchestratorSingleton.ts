import SignalOrchestrator from './signalOrchestrator';

let orchestrator: SignalOrchestrator | undefined;

export function setOrchestrator(o: SignalOrchestrator) {
  orchestrator = o;
}

export function getOrchestrator(): SignalOrchestrator | undefined {
  return orchestrator;
}

export default getOrchestrator;
