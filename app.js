// app.js - Revised for BandcampFetch application
import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import * as bandcampFetch from 'bandcamp-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { myFunction } from './myModule.mjs';

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();
const PORT = 3002; // Changed from 3001 to avoid port conflicts

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Call the imported function (for testing)
myFunction();

// Log the structure of the bandcampFetch module
console.log('BandcampFetch module initialized:');
console.log('- Default export available:', !!bandcampFetch.default);
console.log('- Available exports:', Object.keys(bandcampFetch));

// Based on console output from your app launch, we can see it's being loaded with a default export
// Get the BandcampFetch instance (either from default or directly)
const bcFetch = bandcampFetch.default || bandcampFetch;

// Utility function to save search results to file
function saveToFile(searchTerm, results, textContent) {
  try {
    const resultsDir = 'Results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
      console.log(`Created directory: ${resultsDir}`);
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const filePath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filePath, textContent);
    console.log(`Results saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// Function to search Bandcamp
async function searchBandcamp(searchTerm) {
  try {
    console.log(`Starting search for "${searchTerm}"...`);
    
    // Use the search API from the bandcampFetch instance
    // Based on the module structure you shared earlier (showing SearchAPI class)
    let results;
    
    if (bcFetch && bcFetch.search) {
      // The search API is directly available on the object
      results = await bcFetch.search.search({ 
        query: searchTerm,
        page: 1 
      });
    } else {
      // Try using the SearchAPI class directly
      const searchAPI = new bandcampFetch.SearchAPI();
      results = await searchAPI.search({ 
        query: searchTerm,
        page: 1 
      });
    }
    
    // Check if we have valid results
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
    
    const filePath = saveToFile(searchTerm, results, textContent);
    
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

// API Routes
app.post('/api/search', async (req, res) => {
  const searchTerm = req.body.searchTerm;
  
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
  }
  
  try {
    const result = await searchBandcamp(searchTerm);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/search endpoint:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

app.post('/api/album-info', async (req, res) => {
  const albumUrl = req.body.albumUrl;
  
  if (!albumUrl) {
    return res.status(400).json({ error: 'Album URL is required' });
  }
  
  try {
    // Use the album API from the bandcampFetch instance
    const albumAPI = bcFetch.album;
    
    if (!albumAPI) {
      throw new Error('Album API not available');
    }
    
    const info = await albumAPI.getInfo({ albumUrl });
    res.json(info);
  } catch (error) {
    console.error(`Error fetching album info: ${error}`);
    res.status(500).json({ 
      error: 'Error fetching album info', 
      message: error.message 
    });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Server started successfully!');
});