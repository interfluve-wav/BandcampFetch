// jsonApiFormatter.js - Format results according to JSON:API specification
// Based on https://jsonapi.org/format/

/**
 * Format search results according to JSON:API specification
 * @param {Array} results - Array of Bandcamp search results with Tidal matches
 * @param {string} searchTerm - The original search term
 * @returns {Object} - JSON:API formatted response
 */
export function formatAsJsonApi(results, searchTerm) {
    // Primary data - an array of resource objects
    const data = results.map((item, index) => {
      // Create unique IDs for each resource
      const id = `bandcamp-${item.type}-${index}`;
      
      // Create the resource object
      const resource = {
        id,
        type: 'track', // Using 'track' as the general type, could also be 'album' or 'artist'
        attributes: {
          name: item.name || item.title,
          artist: item.artist?.name || 'Unknown Artist',
          sourceType: item.type,
          url: item.url,
          releaseDate: item.releaseDate || null
        },
        relationships: {}
      };
      
      // Add Tidal relationship if found
      if (item.tidal && item.tidal.found && item.tidal.match) {
        const tidalId = `tidal-track-${item.tidal.match.id}`;
        
        resource.relationships.tidal = {
          data: {
            id: tidalId,
            type: 'tidalTrack'
          }
        };
        
        // Add Tidal resource to included array
        includedResources.push({
          id: tidalId,
          type: 'tidalTrack',
          attributes: {
            name: item.tidal.match.title,
            artist: item.tidal.match.artist?.name || 'Unknown Artist',
            id: item.tidal.match.id,
            url: `https://tidal.com/browse/track/${item.tidal.match.id}`,
            matchConfidence: item.tidal.matchConfidence || 'unknown'
          }
        });
      }
      
      return resource;
    });
    
    // Included resources (related Tidal tracks)
    const includedResources = [];
    
    // Add meta information
    const meta = {
      searchTerm,
      totalResults: results.length,
      tidalMatches: results.filter(item => item.tidal && item.tidal.found).length,
      timestamp: new Date().toISOString()
    };
    
    // Build the JSON:API document
    return {
      data,
      included: includedResources,
      meta
    };
  }
  
  /**
   * Save JSON:API formatted results to a file
   * @param {Object} jsonApiData - JSON:API formatted data
   * @param {string} searchTerm - The original search term
   * @param {string} resultsDir - Directory to save the file
   * @returns {string} - Path to the saved file
   */
  export function saveJsonApiResults(jsonApiData, searchTerm, resultsDir = 'Results') {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure Results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    // Format the filename with date and search term
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-jsonapi.json`;
    const filePath = path.join(resultsDir, filename);
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(jsonApiData, null, 2));
    console.log(`JSON:API formatted results saved to ${filePath}`);
    
    return filePath;
  }