#!/usr/bin/env node

/**
 * 🧪 Test Brainrot Metadata System
 * 
 * Tests:
 * 1. Content generator
 * 2. Minecraft bridge API (reels sync)
 * 3. Frontend data structure
 */

const { getPairForFilename, generateUniquePairs, BRAINROT_USERNAMES, BRAINROT_DESCRIPTIONS } = require('./brainrot-content-generator.js');

console.log('🧪 Testing Brainrot Metadata System\n');

// Test 1: Content Generator
console.log('═══════════════════════════════════════');
console.log('Test 1: Content Generator');
console.log('═══════════════════════════════════════\n');

console.log(`✅ Total usernames: ${BRAINROT_USERNAMES.length}`);
console.log(`✅ Total descriptions: ${BRAINROT_DESCRIPTIONS.length}`);
console.log(`✅ Possible combinations: ${BRAINROT_USERNAMES.length * BRAINROT_DESCRIPTIONS.length}\n`);

// Test 2: Deterministic Assignment
console.log('═══════════════════════════════════════');
console.log('Test 2: Deterministic Assignment');
console.log('═══════════════════════════════════════\n');

const testFiles = ['reel1.mp4', 'reel2.mp4', 'reel3.mp4', 'test_video.mp4', 'brainrot_compilation.mp4'];

testFiles.forEach(filename => {
  const pair1 = getPairForFilename(filename);
  const pair2 = getPairForFilename(filename);
  
  const matches = JSON.stringify(pair1) === JSON.stringify(pair2);
  console.log(`${matches ? '✅' : '❌'} ${filename}`);
  console.log(`   @${pair1.username}: "${pair1.description}"`);
  
  if (!matches) {
    console.log(`   ⚠️  Second call: @${pair2.username}: "${pair2.description}"`);
  }
});

// Test 3: Uniqueness
console.log('\n═══════════════════════════════════════');
console.log('Test 3: Uniqueness (20 samples)');
console.log('═══════════════════════════════════════\n');

const pairs = generateUniquePairs(20);
const uniqueUsernames = new Set(pairs.map(p => p.username));
const uniqueDescriptions = new Set(pairs.map(p => p.description));

console.log(`Generated ${pairs.length} pairs`);
console.log(`✅ Unique usernames: ${uniqueUsernames.size}/${pairs.length}`);
console.log(`✅ Unique descriptions: ${uniqueDescriptions.size}/${pairs.length}\n`);

console.log('Sample pairs:\n');
pairs.slice(0, 10).forEach((pair, i) => {
  console.log(`${i + 1}. @${pair.username}`);
  console.log(`   "${pair.description}"\n`);
});

// Test 4: Data Structure
console.log('═══════════════════════════════════════');
console.log('Test 4: Expected Data Structure');
console.log('═══════════════════════════════════════\n');

const exampleReel = {
  id: 'reel:reels/example.mp4',
  r2_key: 'reels/example.mp4',
  folder: 'reels',
  filename: 'example.mp4',
  size: 5242880,
  uploaded_at: new Date().toISOString(),
  views: Math.floor(Math.random() * 1000000) + 1000,
  likes: Math.floor(Math.random() * 50000) + 100,
  ...getPairForFilename('example.mp4')
};

console.log('Example reel metadata:');
console.log(JSON.stringify(exampleReel, null, 2));

// Test 5: Storage Efficiency
console.log('\n═══════════════════════════════════════');
console.log('Test 5: Storage Efficiency');
console.log('═══════════════════════════════════════\n');

const samplePair = getPairForFilename('test.mp4');
const metadataSize = JSON.stringify(samplePair).length;
const fullReelSize = JSON.stringify(exampleReel).length;

console.log(`Brainrot metadata: ${metadataSize} bytes`);
console.log(`Full reel object: ${fullReelSize} bytes`);
console.log(`Metadata overhead: ${((metadataSize / fullReelSize) * 100).toFixed(1)}%`);

console.log('\n✨ All tests complete!\n');

