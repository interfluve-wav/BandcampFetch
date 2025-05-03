// myModule.mjs - Module with utility functions for the Bandcamp Search application

export function myFunction() {
    console.log('Hello from myFunction!');
  }
  
  // Format duration from seconds to MM:SS format
  export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Format date to human-readable format
  export function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Parse error messages in a consistent format
  export function parseError(error) {
    if (!error) return 'Unknown error';
    
    if (error.message) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return JSON.stringify(error);
    }
  }
  
  // Add more utility functions as needed