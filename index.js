// Import the library
import bcfetch from 'bandcamp-fetch';

// Make your first API call
async function searchAlbum() {
  try {
    // Search for an album
    const results = await bcfetch.search.albums({
      query: 'beach house depression cherry',
      page: 1
    });
    
    console.log(results);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the function
searchAlbum();