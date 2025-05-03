# BandcampFetch

## Overview

BandcampFetch is a Node.js application that allows you to fetch data from Bandcamp. This README provides instructions on how to set up and run the application.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 12 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. **Clone the repository:**

   Open your terminal and run the following command to clone the repository:

   ```bash
   git clone https://github.com/yourusername/BandcampFetch.git
   ```

   Replace `yourusername` with your GitHub username.

2. **Navigate to the project directory:**

   ```bash
   cd BandcampFetch
   ```

3. **Install dependencies:**

   Run the following command to install the required dependencies:

   ```bash
   npm install
   ```

## Configuration

1. **Update `package.json`:**

   Ensure that your `package.json` file includes the following line to specify the module type:

   ```json
   "type": "module"
   ```

2. **Modify `app.js`:**

   Ensure that your `app.js` file uses ES module syntax. For example:

   ```javascript
   import fs from 'fs';
   import path from 'path';
   import { fileURLToPath } from 'url';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

## Running the Application

1. **Start the server:**

   In your terminal, run the following command to start the server:

   ```bash
   npm start
   ```

2. **Access the application:**

   Open your web browser and navigate to `http://localhost:3000` (or the port specified in your application) to access the application.

## Troubleshooting

- If you encounter warnings about module types, ensure that your `package.json` file has `"type": "module"` specified.
- If you see errors related to `require`, make sure you are using `import` statements instead.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [Bandcamp](https://bandcamp.com/)