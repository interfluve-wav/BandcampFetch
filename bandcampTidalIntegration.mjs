// bandcampTidalIntegration.mjs - Integration between Bandcamp and Tidal
import fs from 'fs';
import path from 'path';
import tidalAPI from './tidalApi.js'; // Default Tidal API

/**
 * Class to integrate BandcampFetch with Tidal API
 */
class BandcampTidalIntegration {
  constructor() {
    this.initialized = false;
    this.resultsDir = 'Results';
    this.tidalAPI = tidalAPI; // Default Tidal API implementation
  }

  /**
   * Initialize the integration
   * @param {Object} config - Configuration options
   * @param {string} config.tidalClientId - Tidal API client ID
   * @param {string} config.tidalClientSecret - Tidal API client secret
   * @param {Object} config.tidalAPI - Optional custom Tidal API implementation
   */
  initialize(config) {
    // Use custom Tidal API if provided
    if (config.tidalAPI) {
      this.tidalAPI = config.tidalAPI;
      console.log('BandcampTidal Integration using custom Tidal API');
    }
    
    // Initialize the Tidal API
    this.tidalAPI.initialize({
      clientId: config.tidalClientId,
      clientSecret: config.tidalClientSecret
    });
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir);
    }
    
    this.initialized = true;
    console.log('BandcampTidal Integration initialized');
  }

  /**
   * Check Bandcamp search results against Tidal
   * @param {Array} bandcampResults - Array of tracks from Bandcamp
   * @returns {Promise<Array>} - Array of results with Tidal match information
   */
  async checkTracksOnTidal(bandcampResults) {
    if (!this.initialized) {
      throw new Error('Integration not initialized. Call initialize() first.');
    }
    
    if (!bandcampResults || !Array.isArray(bandcampResults)) {
      throw new Error('Invalid Bandcamp results provided');
    }
    
    const enrichedResults = [];
    
    // Process each Bandcamp result
    for (const result of bandcampResults) {
      try {
        // Extract artist and title information
        const songInfo = {
          title: result.name || result.title,
          artist: result.artist?.name || 'Unknown Artist'
        };
        
        console.log(`Checking Tidal for: ${songInfo.artist} - ${songInfo.title}`);
        
        // Find on Tidal using the current Tidal API implementation
        const tidalMatch = await this.tidalAPI.findSong(songInfo);
        
        // Add Tidal information to the result
        const enrichedResult = {
          ...result,
          tidal: {
            found: !!tidalMatch,
            match: tidalMatch || null,
            matchConfidence: tidalMatch ? 'high' : 'none' // Simple confidence rating
          }
        };
        
        enrichedResults.push(enrichedResult);
      } catch (error) {
        console.error(`Error processing ${result.name || 'track'}:`, error);
        // Add the original result without Tidal info
        enrichedResults.push({
          ...result,
          tidal: {
            found: false,
            error: error.message
          }
        });
      }
    }
    
    return enrichedResults;
  }

  /**
   * Save the integrated results to a file
   * @param {string} searchTerm - The original search term
   * @param {Array} results - The integrated results
   * @returns {string} - Path to the saved file
   */
  saveIntegratedResults(searchTerm, results) {
    try {
      // Format current date
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Create filename
      const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-tidal.json`;
      const filePath = path.join(this.resultsDir, filename);
      
      // Create the content
      const content = {
        searchTerm,
        date: currentDate,
        totalResults: results.length,
        tidalMatches: results.filter(r => r.tidal?.found).length,
        results
      };
      
      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`Integrated results saved to ${filePath}`);
      
      return filePath;
    } catch (error) {
      console.error('Error saving integrated results:', error);
      return null;
    }
  }

  /**
   * Generate a summary report of Bandcamp results with Tidal matches
   * @param {Array} results - Integrated results
   * @returns {string} - HTML report content
   */
  generateHTMLReport(results) {
    if (!results || !Array.isArray(results)) {
      return '<p>No results available</p>';
    }
    
    const tidalMatches = results.filter(r => r.tidal?.found).length;
    const matchPercentage = ((tidalMatches / results.length) * 100).toFixed(1);
    
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bandcamp to Tidal Comparison</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
          h1, h2 { color: #1a1a1a; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .stat { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .found { color: #28a745; }
          .not-found { color: #dc3545; }
          .tidal-link { display: inline-block; background: #000; color: #fff; padding: 5px 10px; text-decoration: none; border-radius: 3px; }
          .tidal-link:hover { background: #333; }
          .bandcamp-link { display: inline-block; background: #1DA0C3; color: #fff; padding: 5px 10px; text-decoration: none; border-radius: 3px; }
          .bandcamp-link:hover { background: #1686a3; }
        </style>
      </head>
      <body>
        <h1>Bandcamp to Tidal Comparison</h1>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>Total tracks searched: <span class="stat">${results.length}</span></p>
          <p>Tracks found on Tidal: <span class="stat">${tidalMatches}</span> (${matchPercentage}%)</p>
        </div>
        
        <h2>Results</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Artist</th>
              <th>Track</th>
              <th>On Tidal?</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    results.forEach((result, index) => {
      const artistName = result.artist?.name || 'Unknown Artist';
      const trackName = result.name || result.title || 'Unknown Track';
      const foundOnTidal = result.tidal?.found;
      const tidalTrack = result.tidal?.match;
      
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${artistName}</td>
          <td>${trackName}</td>
          <td class="${foundOnTidal ? 'found' : 'not-found'}">${foundOnTidal ? 'Yes' : 'No'}</td>
          <td>
            <a href="${result.url}" class="bandcamp-link" target="_blank">Bandcamp</a>
            ${foundOnTidal && tidalTrack ? 
              `<a href="https://tidal.com/browse/track/${tidalTrack.id}" class="tidal-link" target="_blank">Tidal</a>` : 
              ''}
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    return html;
  }
}

export default new BandcampTidalIntegration();