const express = require('express');
const cors = require('cors'); // <-- Add this line to import CORS
const pool = require('./db'); // Import the pool from db.js
const app = express();
const port = 3000;

// Enable CORS for all origins (you can restrict this to your frontend domain later)
app.use(cors({
  origin: 'http://100.26.107.8' // The IP of your web server
}));

// Define an API route to get the drivers' data
app.get('/api/drivers', async (req, res) => {
  try {
    // Query the drivers table
    const result = await pool.query('SELECT * FROM drivers');
    res.json(result.rows); // Send the data as a JSON response
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching drivers data');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App server listening at http://localhost:${port}`);
});
