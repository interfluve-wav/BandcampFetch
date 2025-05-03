// tidalAPI.js - Fixed version with hardcoded credentials
import fetch from 'node-fetch';

class TidalAPI {
  constructor() {
    // Hardcoded credentials
    this.clientId = 'zZiXboofInpeEqpY';
    this.clientSecret = 'eWJW7Ii19OdylOZR8JZiNN9sCxW7knbJwB8Mxid8TUU=';
    this.token = null;
    this.tokenExpiry = null;
  }

  initialize(config) {
    // You can still accept config but use the hardcoded values for now
    console.log('[TidalAPI] Initialize called');
    // No need to update the credentials since they're already set in constructor
  }

  async getToken() {
    try {
      // Check if we already have a valid token
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      console.log('[TidalAPI] Getting new Tidal access token...');
      
      // Create authorization header
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      // Prepare token request
      const response = await fetch('https://auth.tidal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      this.token = data.access_token;
      
      // Set token expiry (subtract 5 minutes for safety)
      const expiresInMs = (data.expires_in - 300) * 1000;
      this.tokenExpiry = Date.now() + expiresInMs;
      
      console.log('[TidalAPI] Successfully obtained Tidal access token');
      return this.token;
    } catch (error) {
      console.error('[TidalAPI] Error getting Tidal token:', error);
      throw error;
    }
  }

  async findSong(songInfo) {
    try {
      // Build search query
      const artist = songInfo.artist || '';
      const title = songInfo.title || '';
      const query = `${artist} ${title}`.trim();
      
      if (!query) {
        return null;
      }
      
      // Search on Tidal
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
      console.error('[TidalAPI] Error finding song:', error);
      return null;
    }
  }

  async searchTracks(query) {
    try {
      const token = await this.getToken();
      
      const url = new URL('https://api.tidal.com/v1/search/tracks');
      url.searchParams.append('query', query);
      url.searchParams.append('limit', '5');
      url.searchParams.append('countryCode', 'US');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[TidalAPI] Error searching Tidal:', error);
      return { items: [] };
    }
  }

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
    
    console.log('[TidalAPI] Best match score:', scoredResults[0]?.score);
    
    // Return highest scoring result if score is at least 50
    return scoredResults[0]?.score >= 50 ? scoredResults[0].item : null;
  }
}

export default new TidalAPI();