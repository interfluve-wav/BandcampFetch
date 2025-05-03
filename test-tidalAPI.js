test-tidalAPI.js
// test-tidal-api.js - Test script for Tidal API
import fetch from 'node-fetch';

// Basic Tidal API client
class TidalTestAPI {
  constructor() {
    // Hardcoded credentials
    this.clientId = 'zZiXboofInpeEqpY';
    this.clientSecret = 'eWJW7Ii19OdylOZR8JZiNN9sCxW7knbJwB8Mxid8TUU=';
    this.token = null;
  }

  async getToken() {
    try {
      console.log('Attempting to get Tidal token with credentials:');
      console.log('Client ID:', this.clientId);
      console.log('Client Secret:', this.clientSecret);
      
      // Prepare token request
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      console.log('Authorization header:', `Basic ${authHeader}`);
      
      const response = await fetch('https://auth.tidal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        },
        body: 'grant_type=client_credentials'
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.text();
      console.log('Response body:', data);
      
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${data}`);
      }
      
      const tokenData = JSON.parse(data);
      this.token = tokenData.access_token;
      console.log('Successfully obtained token:', this.token.substring(0, 10) + '...');
      return this.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  async testSearch(query = 'test') {
    try {
      const token = await this.getToken();
      
      console.log(`Searching for "${query}" with token...`);
      
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
      
      console.log('Search response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${errorText}`);
      }
      
      const results = await response.json();
      console.log('Search results count:', results.items?.length || 0);
      console.log('First result:', results.items?.[0] ? JSON.stringify(results.items[0], null, 2) : 'No results');
      
      return results;
    } catch (error) {
      console.error('Error during search:', error);
      throw error;
    }
  }
}

// Run the test
async function runTest() {
  try {
    console.log('=== TIDAL API TEST ===');
    const tidal = new TidalTestAPI();
    
    console.log('\n1. Testing token acquisition:');
    await tidal.getToken();
    
    console.log('\n2. Testing search:');
    await tidal.testSearch('Queen Bohemian Rhapsody');
    
    console.log('\n=== TEST COMPLETE ===');
  } catch (error) {
    console.error('\nTest failed with error:', error);
  }
}

runTest();