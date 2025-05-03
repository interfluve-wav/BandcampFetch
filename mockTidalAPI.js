// mockTidalAPI.js - Mock implementation of Tidal API for development
import fetch from 'node-fetch';

class MockTidalAPI {
  constructor() {
    this.token = 'mock-token-for-testing';
    this.tokenExpiry = Date.now() + 3600000; // 1 hour expiry
    console.log('[MockTidalAPI] Initialized');
  }

  /**
   * Initialize the mock Tidal API
   * @param {Object} config - Configuration options (not used in mock)
   */
  initialize(config = {}) {
    console.log('[MockTidalAPI] Initialize called with config:', 
      config ? JSON.stringify(config) : 'undefined');
    console.log('[MockTidalAPI] Using MOCK implementation');
  }

  /**
   * Mock token retrieval
   * @returns {Promise<string>} Mock token
   */
  async getToken() {
    console.log('[MockTidalAPI] Mock: Getting token');
    return Promise.resolve(this.token);
  }

  /**
   * Find a song on mock Tidal
   * @param {Object} songInfo - Track information
   * @param {string} songInfo.artist - Artist name
   * @param {string} songInfo.title - Track title
   * @returns {Promise<Object|null>} Mock track or null
   */
  async findSong(songInfo) {
    try {
      // Build search query
      const artist = songInfo.artist || '';
      const title = songInfo.title || '';
      const query = `${artist} ${title}`.trim();
      
      if (!query) {
        return null;
      }
      
      console.log(`[MockTidalAPI] Finding song: ${artist} - ${title}`);
      
      // Search with mock implementation
      const results = await this.searchTracks(query);
      
      if (!results.items || results.items.length === 0) {
        return null;
      }
      
      // Find best match
      const bestMatch = this.findBestMatch(results.items, {
        artist: artist.toLowerCase(),
        title: title.toLowerCase()
      });
      
      return bestMatch;
    } catch (error) {
      console.error('[MockTidalAPI] Error finding song:', error);
      return null;
    }
  }

  /**
   * Mock track search implementation
   * @param {string} query - Search query
   * @returns {Promise<Object>} Mock search results
   */
  async searchTracks(query) {
    try {
      console.log(`[MockTidalAPI] Mock search for: "${query}"`);
      
      // Randomly determine if we "find" the track (for testing)
      const found = Math.random() > 0.3; // 70% chance of being "found"
      
      if (!found) {
        console.log('[MockTidalAPI] Mock: No results found');
        return { items: [] };
      }
      
      // Generate a fake track ID based on the query
      const fakeId = Math.floor(Math.random() * 100000000).toString();
      
      // Extract artist and title from query if possible
      let artist = "Mock Artist";
      let title = query;
      
      if (query.includes(" - ")) {
        const parts = query.split(" - ");
        artist = parts[0];
        title = parts[1];
      }
      
      console.log(`[MockTidalAPI] Mock: Found track "${title}" by "${artist}"`);
      
      // Mock search results
      return {
        items: [
          {
            id: fakeId,
            title: title,
            artist: { name: artist },
            album: { title: "Mock Album" },
            duration: 180, // 3 minutes
            url: `https://tidal.com/browse/track/${fakeId}`
          }
        ]
      };
    } catch (error) {
      console.error('[MockTidalAPI] Error in mock search:', error);
      return { items: [] };
    }
  }

  /**
   * Find best match from results
   * @param {Array} items - Search result items
   * @param {Object} songInfo - Original song info
   * @returns {Object|null} Best match or null
   */
  findBestMatch(items, songInfo) {
    if (!items || items.length === 0) {
      return null;
    }
    
    // Score each result
    const scoredResults = items.map(item => {
      const resultArtist = (item.artist?.name || '').toLowerCase();
      const resultTitle = (item.title || '').toLowerCase();
      
      // Calculate similarity score
      let score = 0;
      
      // Artist match
      if (resultArtist === songInfo.artist) {
        score += 50;
      } else if (resultArtist.includes(songInfo.artist) || songInfo.artist.includes(resultArtist)) {
        score += 25;
      }
      
      // Title match
      if (resultTitle === songInfo.title) {
        score += 50;
      } else if (resultTitle.includes(songInfo.title) || songInfo.title.includes(resultTitle)) {
        score += 25;
      }
      
      return { item, score };
    });
    
    // Sort by score (highest first)
    scoredResults.sort((a, b) => b.score - a.score);
    
    console.log('[MockTidalAPI] Best match score:', scoredResults[0]?.score);
    
    // Return highest scoring result if score is at least 50
    return scoredResults[0]?.score >= 50 ? scoredResults[0].item : null;
  }
}

export default new MockTidalAPI();