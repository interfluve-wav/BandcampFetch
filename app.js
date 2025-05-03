import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import bandcampFetch from 'bandcamp-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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

async function searchBandcamp(searchTerm) {
  try {
    console.log(`Starting search for "${searchTerm}"...`);

    const results = await bandcampFetch.search.albums({
      query: searchTerm,
      page: 1
    });

    if (!results?.items?.length) {
      return {
        success: false,
        message: `No results found for "${searchTerm}"`
      };
    }

    const currentDate = new Date().toISOString().split('T')[0];
    let textContent = `Search Results for "${searchTerm}"\nDate: ${currentDate}\n\nFound ${results.items.length} albums:\n\n`;

    results.items.forEach((album, index) => {
      textContent += `${index + 1}. ${album.name} by ${album.artist.name}\n`;
      textContent += `   URL: ${album.url}\n`;
      textContent += `   Release Date: ${album.releaseDate}\n\n`;
    });

    const filePath = saveToFile(searchTerm, results, textContent);

    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: 'An error occurred'
    };
  }
}

app.post('/api/search', async (req, res) => {
  const searchTerm = req.body.searchTerm;

  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
  }

  const result = await searchBandcamp(searchTerm);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});