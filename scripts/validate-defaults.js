#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const schemaPath = path.resolve(__dirname, '..', 'config', 'defaults.schema.json');
const defaultsPath = path.resolve(__dirname, '..', 'config', 'defaults.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const validate = ajv.compile(schema);
const valid = validate(data);
if (!valid) {
  console.error('Validation errors for config/defaults.json:');
  for (const err of validate.errors) {
    console.error('-', err.instancePath || '/', err.message);
  }
  process.exit(2);
}
console.log('config/defaults.json validated successfully.');
process.exit(0);
