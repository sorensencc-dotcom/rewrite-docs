import { verifyIngestionEntry } from './cic-ingestion/dist/ingestion/verify.js';

// Test 1: Valid entry
const valid = {
  id: 'test-001',
  source: 'github',
  payload: { data: 'test' }
};
console.log('Test 1 (valid):', verifyIngestionEntry(valid));

// Test 2: Missing ID
const noId = {
  source: 'github',
  payload: { data: 'test' }
};
console.log('Test 2 (missing id):', verifyIngestionEntry(noId));

// Test 3: Bad type
const badType = {
  id: 123,
  source: 'github',
  payload: { data: 'test' }
};
console.log('Test 3 (bad id type):', verifyIngestionEntry(badType));

// Test 4: Missing payload
const noPayload = {
  id: 'test-004',
  source: 'github'
};
console.log('Test 4 (missing payload):', verifyIngestionEntry(noPayload));
