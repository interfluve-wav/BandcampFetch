// app.js - Server with separate Mock Tidal API
import { config } from 'dotenv'; // Import dotenv
config(); // This loads the .env file

// Check if variables are loaded
console.log('Environment variables loaded:');
console.log('TIDAL_CLIENT_ID:', process.env.TIDAL_CLIENT_ID ? 'defined' : 'undefined');
console.log('TIDAL_CLIENT_SECRET:', process.env.TIDAL_CLIENT_SECRET ? 'defined' : 'undefined');

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import bandcampTidalIntegration from './bandcampTidalIntegration.mjs'; // Import the integration module
import tidalAPI from './tidalApi.js'; // Real Tidal API
import mockTidalAPI from './mockTidalAPI.js'; // Mock Tidal API
import bcFetch from 'bandcamp-fetch'; // Import bcFetch
import bandcampFetch from 'bandcamp-fetch'; // Import bandcampFetch
import { formatAsJsonApi, saveJsonApiResults } from './jsonApiFormatter.js';

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();
const PORT = 3002; // Make sure this port isn't in use

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure Results directory exists
if (!fs.existsSync('Results')) {
  fs.mkdirSync('Results');
}

// Choose which Tidal API to use (mock or real)
const USE_MOCK_TIDAL = true; // Set to false to use real Tidal API
const activeTidalAPI = USE_MOCK_TIDAL ? mockTidalAPI : tidalAPI;




// Initialize the active Tidal API
activeTidalAPI.initialize({
  clientId: process.env.TIDAL_CLIENT_ID,
  clientSecret: process.env.TIDAL_CLIENT_SECRET
});

console.log(`Using ${USE_MOCK_TIDAL ? 'MOCK' : 'REAL'} Tidal API implementation`);
console.log('Direct initialization with:', 
  process.env.TIDAL_CLIENT_ID, 
  process.env.TIDAL_CLIENT_SECRET
);

// Update bandcampTidalIntegration to use the active Tidal API
// This requires modifying the bandcampTidalIntegration.mjs file to accept a tidalAPI parameter
bandcampTidalIntegration.initialize({
  tidalClientId: process.env.TIDAL_CLIENT_ID || 'default_client_id',
  tidalClientSecret: process.env.TIDAL_CLIENT_SECRET || 'default_client_secret',
  tidalAPI: activeTidalAPI // Pass the active API implementation
});

/**
 * Save search results to a text file
 * @param {string} searchTerm - The search term used
 * @param {Array} results - The search results
 * @param {string} textContent - The formatted text content to save
 * @returns {string|null} - Path to the saved file or null if error
 */
function saveToFile(searchTerm, results, textContent) {
  try {
    // Ensure Results directory exists
    const resultsDir = 'Results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
      console.log(`Created directory: ${resultsDir}`);
    }
    
    // Format the filename with date and search term
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const filePath = path.join(resultsDir, filename);
    
    // If textContent is not provided, generate it
    if (!textContent) {
      textContent = `Search Results for "${searchTerm}"\nDate: ${currentDate}\n\nFound ${results.length} items:\n\n`;
      
      results.forEach((item, index) => {
        if (item.type === 'album') {
          textContent += `${index + 1}. [ALBUM] ${item.name} by ${item.artist?.name || 'Unknown Artist'}\n`;
        } else if (item.type === 'track') {
          textContent += `${index + 1}. [TRACK] ${item.name} by ${item.artist?.name || 'Unknown Artist'}\n`;
        } else if (item.type === 'artist') {
          textContent += `${index + 1}. [ARTIST] ${item.name}\n`;
        } else {
          textContent += `${index + 1}. [${item.type?.toUpperCase() || 'UNKNOWN'}] ${item.name}\n`;
        }
        
        textContent += `   URL: ${item.url}\n`;
        if (item.releaseDate) {
          textContent += `   Release Date: ${item.releaseDate}\n`;
        }
        textContent += '\n';
      });
    }
    
    // Write to file
    fs.writeFileSync(filePath, textContent);
    console.log(`Results saved to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// Function for Bandcamp search
async function searchBandcamp(searchTerm) {
  try {
    console.log(`Starting search for "${searchTerm}"...`);
    
    // Determine which search method to use based on the module structure
    let results;
    
    // First try if we're using a CommonJS require-style import
    if (bcFetch.search) {
      console.log('Using bcFetch.search');
      results = await bcFetch.search.search({ 
        query: searchTerm,
        page: 1 
      });
    } 
    // Try using SearchAPI directly if available
    else if (bandcampFetch.SearchAPI) {
      console.log('Using new SearchAPI instance');
      const searchAPI = new bandcampFetch.SearchAPI();
      results = await searchAPI.search({ 
        query: searchTerm,
        page: 1 
      });
    }
    // If neither works, throw an error
    else {
      throw new Error('Unable to find search method in bandcamp-fetch module');
    }
    
    console.log(`Found ${results?.items?.length || 0} results`);
    
    if (!results || !results.items || results.items.length === 0) {
      return {
        success: false,
        message: `No results found for "${searchTerm}"`
      };
    }
    
    // Format results for display and file saving
    const currentDate = new Date().toISOString().split('T')[0];
    let textContent = `Search Results for "${searchTerm}"\nDate: ${currentDate}\n\nFound ${results.items.length} items:\n\n`;
    
    results.items.forEach((item, index) => {
      if (item.type === 'album') {
        textContent += `${index + 1}. [ALBUM] ${item.name} by ${item.artist?.name || 'Unknown Artist'}\n`;
      } else if (item.type === 'track') {
        textContent += `${index + 1}. [TRACK] ${item.name} by ${item.artist?.name || 'Unknown Artist'}\n`;
      } else if (item.type === 'artist') {
        textContent += `${index + 1}. [ARTIST] ${item.name}\n`;
      } else {
        textContent += `${index + 1}. [${item.type?.toUpperCase() || 'UNKNOWN'}] ${item.name}\n`;
      }
      
      textContent += `   URL: ${item.url}\n`;
      if (item.releaseDate) {
        textContent += `   Release Date: ${item.releaseDate}\n`;
      }
      textContent += '\n';
    });
    
    // Save results to a file
    const filePath = saveToFile(searchTerm, results.items, textContent);
    console.log('Saved results to file:', filePath);
    
    return {
      success: true,
      results: results.items,
      filePath,
      totalResults: results.items.length
    };
  } catch (error) {
    console.error('Error during search:', error);
    return {
      success: false,
      message: `An error occurred: ${error.message}`
    };
  }
}

// Function to check Bandcamp results against Tidal directly
// (use this if you want to bypass bandcampTidalIntegration)
async function checkOnTidal(bandcampItems) {
  console.log(`Directly checking ${bandcampItems.length} items on Tidal`);
  
  const enrichedResults = [];
  
  // Process each item sequentially to avoid rate limiting
  for (const item of bandcampItems) {
    try {
      // Extract artist and title information
      const songInfo = {
        title: item.name || item.title,
        artist: item.artist?.name || 'Unknown Artist'
      };
      
      console.log(`Checking Tidal for: ${songInfo.artist} - ${songInfo.title}`);
      
      // Find match on Tidal
      const tidalMatch = await activeTidalAPI.findSong(songInfo);
      
      // Add Tidal information to the result
      enrichedResults.push({
        ...item,
        tidal: {
          found: !!tidalMatch,
          match: tidalMatch || null,
          matchConfidence: tidalMatch ? 'high' : 'none' // Simple confidence rating
        }
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error checking item "${item.name}" on Tidal:`, error);
      enrichedResults.push({
        ...item,
        tidal: {
          found: false,
          error: error.message
        }
      });
    }
  }
  
  return enrichedResults;
}

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search term is required' 
      });
    }
    
    const result = await searchBandcamp(searchTerm);
    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Endpoint for combined Bandcamp-Tidal search with JSON:API support
app.post('/api/search-with-tidal', async (req, res) => {
  try {
    const { searchTerm, format } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search term is required' 
      });
    }
    
    console.log(`Processing search with Tidal: "${searchTerm}"`);
    
    // Step 1: Search Bandcamp
    const bandcampResult = await searchBandcamp(searchTerm);
    
    if (!bandcampResult.success) {
      return res.json(bandcampResult);
    }
    
    // Step 2: Check results on Tidal
    // You can use either the direct method or the integration
    const integratedResults = await bandcampTidalIntegration.checkTracksOnTidal(bandcampResult.results);
    
    // Step 3: Save the integrated results
    const jsonFilePath = bandcampTidalIntegration.saveIntegratedResults(searchTerm, integratedResults);
    
    // Step 4: Generate HTML report
    const htmlReport = bandcampTidalIntegration.generateHTMLReport(integratedResults);
    
    // Step 5: Save HTML report
    const htmlFileName = `${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-report.html`;
    const htmlFilePath = path.join('Results', htmlFileName);
    fs.writeFileSync(htmlFilePath, htmlReport);
    
    // Step 6: Format as JSON:API if requested
    let jsonApiData = null;
    let jsonApiFilePath = null;
    
    if (format === 'jsonapi') {
      jsonApiData = formatAsJsonApi(integratedResults, searchTerm);
      jsonApiFilePath = saveJsonApiResults(jsonApiData, searchTerm);
    }
    
    // Count Tidal matches
    const tidalMatches = integratedResults.filter(item => item.tidal && item.tidal.found).length;
    
    // Return the integrated results
    if (format === 'jsonapi') {
      // Return JSON:API formatted response
      return res.json(jsonApiData);
    } else {
      // Return standard response
      return res.json({
        success: true,
        results: integratedResults,
        bandcampResults: bandcampResult.results.length,
        tidalMatches,
        filePath: bandcampResult.filePath,
        jsonFilePath,
        htmlFilePath,
        htmlReportUrl: `/report/${htmlFileName}`,
        jsonApiFilePath,
        usingMockTidal: USE_MOCK_TIDAL
      });
    }
  } catch (error) {
    console.error('Search with Tidal error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    });
  }
});

// Add an endpoint to specifically get JSON:API formatted results
app.post('/api/jsonapi/search', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Search term is required'
        }]
      });
    }
    
    // Process search
    const bandcampResult = await searchBandcamp(searchTerm);
    
    if (!bandcampResult.success) {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: bandcampResult.message
        }]
      });
    }
    
    // Check on Tidal (using active implementation)
    // Using direct implementation for simplicity in this example
    const integratedResults = await checkOnTidal(bandcampResult.results);
    
    // Format as JSON:API
    const jsonApiData = formatAsJsonApi(integratedResults, searchTerm);
    
    // Save to file if needed
    saveJsonApiResults(jsonApiData, searchTerm);
    
    // Return JSON:API formatted response
    return res.json(jsonApiData);
  } catch (error) {
    console.error('JSON:API search error:', error);
    
    return res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: error.message
      }]
    });
  }
});

// Add this endpoint to serve HTML reports
app.get('/report/:filename', (req, res) => {
  const filename = req.params.filename;
  const reportPath = path.join(__dirname, 'Results', filename);
  
  if (fs.existsSync(reportPath)) {
    res.sendFile(reportPath);
  } else {
    res.status(404).send('Report not found');
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open your browser and visit: http://localhost:${PORT}`);
  
  // Test the active Tidal API connection
  activeTidalAPI.getToken()
    .then(() => console.log(`Successfully connected to ${USE_MOCK_TIDAL ? 'MOCK' : 'REAL'} Tidal API`))
    .catch(error => console.error(`Failed to connect to ${USE_MOCK_TIDAL ? 'MOCK' : 'REAL'} Tidal API:`, error));
});