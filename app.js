const bcfetch = require('bandcamp-fetch');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());

// Function to save results to file
function saveToFile(searchTerm, results, textContent) {
  try {
    // Create Results directory if it doesn't exist
    const resultsDir = 'Results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
      console.log(`Created directory: ${resultsDir}`);
    }
    
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create filename with date and search term
    const filename = `${currentDate}-${searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const filePath = path.join(resultsDir, filename);
    
    // Save to file
    fs.writeFileSync(filePath, textContent);
    console.log(`Results saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// Main search function
async function searchBandcamp(searchTerm) {
  try {
    console.log(`Starting search for "${searchTerm}"...`);
    
    // Search for albums
    const results = await bcfetch.search.albums({
      query: searchTerm,
      page: 1
    });
    
    console.log('Search completed');
    
    if (!results || !results.items || results.items.length === 0) {
      return {
        success: false,
        message: `No results found for "${searchTerm}"`
      };
    }
    
    // Create text content
    const currentDate = new Date().toISOString().split('T')[0];
    let textContent = `Search Results for "${searchTerm}"\n`;
    textContent += `Date: ${currentDate}\n\n`;
    textContent += `Found ${results.items.length} albums:\n\n`;
    
    results.items.forEach((album, index) => {
      textContent += `${index + 1}. ${album.name} by ${album.artist.name}\n`;
      textContent += `   URL: ${album.url}\n`;
      textContent += `   Release Date: ${album.releaseDate}\n\n`;
    });
    
    // Save to file
    const filePath = saveToFile(searchTerm, results, textContent);
    
    // Return formatted results
    return {
      success: true,
      filePath: filePath
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: 'An error occurred'
    };
  }
}

// Run the function with a search term
const searchTerm = process.argv[2] || 'Flux Vortex';
console.log('About to call searchBandcamp()');
searchBandcamp(searchTerm)
  .then(result => {
    if (result.success) {
      console.log('searchBandcamp() completed successfully');
    } else {
      console.log(result.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
console.log('searchBandcamp() called');

const PORT = process.env.PORT || 3001;  // Change to 3001 or another port

// Add search endpoint
app.post('/api/search', async (req, res) => {
  const { searchTerm } = req.body;
  
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  try {
    const result = await searchBandcamp(searchTerm);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during the search' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Remove or comment out the direct searchBandcamp call since we want the server to handle requests
// const searchTerm = process.argv[2] || 'Flux Vortex';
// console.log('About to call searchBandcamp()');
// searchBandcamp(searchTerm)
//   .then(result => {
//     if (result.success) {
//       console.log('searchBandcamp() completed successfully');
//     } else {
//       console.log(result.message);
//     }
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });
// console.log('searchBandcamp() called');