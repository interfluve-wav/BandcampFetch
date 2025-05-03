// testMockTidal.js - Test script for mockTidalAPI.js
import mockTidalAPI from './mockTidalAPI.js';

// Function to test the mock API
async function testMockTidalAPI() {
  console.log('Testing Mock Tidal API...');
  
  // Initialize the API
  mockTidalAPI.initialize({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret'
  });
  
  // Test getting a token
  try {
    const token = await mockTidalAPI.getToken();
    console.log('Got mock token:', token);
  } catch (error) {
    console.error('Error getting token:', error);
  }
  
  // Test searching for tracks
  try {
    // Test a few different tracks
    const testQueries = [
      { artist: 'Radiohead', title: 'Karma Police' },
      { artist: 'Beyoncé', title: 'Formation' },
      { artist: 'The Beatles', title: 'Hey Jude' },
      { artist: 'Kendrick Lamar', title: 'HUMBLE.' }
    ];
    
    for (const query of testQueries) {
      console.log(`\nSearching for: ${query.artist} - ${query.title}`);
      const result = await mockTidalAPI.findSong(query);
      
      if (result) {
        console.log('Found match:', {
          id: result.id,
          title: result.title,
          artist: result.artist.name,
          album: result.album?.title
        });
      } else {
        console.log('No match found');
      }
    }
  } catch (error) {
    console.error('Error searching tracks:', error);
  }
  
  console.log('\nMock Tidal API test complete!');
}

// Run the test
testMockTidalAPI();
