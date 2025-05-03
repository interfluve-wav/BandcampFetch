// app.js - Server with real Tidal API integration
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
import tidalAPI from './tidalAPI.js'; // Import tidalAPI

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

// Directly initialize tidalAPI
tidalAPI.initialize({
  clientId: process.env.TIDAL_CLIENT_ID,
  clientSecret: process.env.TIDAL_CLIENT_SECRET
});

console.log('Direct initialization with:',
  process.env.TIDAL_CLIENT_ID,
  process.env.TIDAL_CLIENT_SECRET
);

// Initialize Bandcamp and Tidal integration
bandcampTidalIntegration.initialize({
  tidalClientId: process.env.TIDAL_CLIENT_ID || 'default_client_id',
  tidalClientSecret: process.env.TIDAL_CLIENT_SECRET || 'default_client_secret'
});

/**
 * Save search results to a file
 * @param {string} searchTerm - The search term used
 * @param {Array} results - The search results to save
 * @returns {string} - Path to the saved file
 */
function saveResultsToFile(searchTerm, results) {
  try {
    // Create Results directory if it doesn't exist
    const resultsDir = 'Results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
      console.log(`Created directory: ${resultsDir}`);
    }
    
    // Format the filename with date and search term
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const filePath = path.join(resultsDir, filename);
    
    // Create a structured object with the results and metadata
    const dataToSave = {
      searchTerm,
      date: currentDate,
      totalResults: results.length,
      tidalMatches: results.filter(item => item.tidal && item.tidal.found).length,
      results
    };
    
    // Write to file as formatted JSON
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log(`Results saved to: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('Error saving results to file:', error);
    return null;
  }
}

// Mock function for Bandcamp search (replace with your actual implementation)
async function searchBandcamp(searchTerm) {
  console.log(`Searching Bandcamp for: ${searchTerm}`);
  
  // Simulated results - replace with actual Bandcamp API call
  const mockResults = [
    {
      type: 'track',
      name: 'Dancing in the Moonlight',
      artist: { name: 'King Harvest' },
      url: 'https://bandcamp.com/track1'
    },
    {
      type: 'album',
      name: 'Rumours',
      artist: { name: 'Fleetwood Mac' },
      url: 'https://bandcamp.com/album1'
    },
    {
      type: 'track',
      name: 'Bohemian Rhapsody',
      artist: { name: 'Queen' },
      url: 'https://bandcamp.com/track2'
    },
    {
      type: 'track',
      name: 'Hotel California',
      artist: { name: 'Eagles' },
      url: 'https://bandcamp.com/track3'
    },
    {
      type: 'track', 
      name: 'Sweet Child O\' Mine',
      artist: { name: 'Guns N\' Roses' },
      url: 'https://bandcamp.com/track4'
    }
  ];
  
  return {
    success: true,
    results: mockResults
  };
}

// Function to check Bandcamp results on Tidal
async function checkOnTidal(bandcampItems) {
  console.log(`Checking ${bandcampItems.length} items on Tidal`);
  
  const enrichedResults = [];
  
  // Process each item sequentially to avoid rate limiting
  for (const item of bandcampItems) {
    try {
      // Find match on Tidal
      const match = await tidalAPI.findMatch(item);
      
      // Add Tidal information to the result
      enrichedResults.push({
        ...item,
        tidal: {
          found: !!match,
          match: match
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

// Combined search endpoint
app.post('/api/search-with-tidal', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
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
    const integratedResults = await checkOnTidal(bandcampResult.results);
    
    // Step 3: Save results to file
    const filePath = saveResultsToFile(searchTerm, integratedResults);
    
    // Count Tidal matches
    const tidalMatches = integratedResults.filter(item => item.tidal && item.tidal.found).length;
    
    // Return the integrated results
    return res.json({
      success: true,
      results: integratedResults,
      tidalMatches,
      savedToFile: filePath ? true : false,
      filePath
    });
  } catch (error) {
    console.error('Search with Tidal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
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
  
  // Test the Tidal API connection
  tidalAPI.getToken()
    .then(() => console.log('Successfully connected to Tidal API'))
    .catch(error => console.error('Failed to connect to Tidal API:', error));
});