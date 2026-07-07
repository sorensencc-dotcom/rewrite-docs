import { verifyIngestionEntry } from './cic-ingestion/src/ingestion/verify.ts';

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
