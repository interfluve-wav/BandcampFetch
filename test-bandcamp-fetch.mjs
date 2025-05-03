// simple-test-bandcamp.mjs
// A simple script to test the bandcamp-fetch module and its methods

import * as bandcampFetch from 'bandcamp-fetch';

console.log('Testing bandcamp-fetch module...');

// Log available exports
console.log('\n1. Available exports:');
console.log(Object.keys(bandcampFetch));

// Check if default export exists
console.log('\n2. Default export available:', !!bandcampFetch.default);

// If default export exists, log its properties
if (bandcampFetch.default) {
  console.log('\n3. Properties on default export:');
  console.log(Object.keys(bandcampFetch.default));
}

// Check for search-related exports
console.log('\n4. Search-related exports:');
if (bandcampFetch.SearchAPI) {
  console.log('- SearchAPI class is available');
}
if (bandcampFetch.default && bandcampFetch.default.search) {
  console.log('- default.search is available');
}
if (bandcampFetch.search) {
  console.log('- search is directly available');
}

// Check for album-related exports
console.log('\n5. Album-related exports:');
if (bandcampFetch.AlbumAPI) {
  console.log('- AlbumAPI class is available');
}
if (bandcampFetch.default && bandcampFetch.default.album) {
  console.log('- default.album is available');
}
if (bandcampFetch.album) {
  console.log('- album is directly available');
}

console.log('\nBasic testing complete.');