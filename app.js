const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db'); // Database connection
const axios = require('axios'); // For Google Maps API

const app = express();
const PORT = 3000;

// 🔐 Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyCO3Ws7ZiYAzcjLfAlO6kUFaLt339ynH1E';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Health check route
app.get('/', (req, res) => {
  res.send('🚦 Server 2 is alive and listening!');
});

// 🚗 Main ride request route (HTML version)
app.post('/request-ride', async (req, res) => {
  const { pickup, dropoff, vehicle } = req.body;
  console.log('📥 Form submitted:', req.body);

  try {
    // 📡 1. Get Google Maps distance & duration to fixed destination
    const mapsRes = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: pickup,
        destinations: dropoff,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const mapData = mapsRes.data.rows[0].elements[0];
    const distance = mapData?.distance?.text || 'N/A';
    const duration = mapData?.duration?.text || 'N/A';

    // 🛠️ 2. Query DB for available drivers
    const result = await pool.query(
      'SELECT name, vehicle_type, vehicle_class, rating FROM drivers WHERE vehicle_class = $1 AND is_available = true',
      [vehicle]
    );
    const drivers = result.rows;

    // 🖼️ 3. Build and send HTML response
    let html = `<h1>Available ${vehicle} Drivers</h1>`;
    html += `<p><strong>Pickup Location:</strong> ${pickup}</p>`;
    html += `<p><strong>Destination:</strong> ${dropoff}</p>`;
 html += `<p><strong>Estimated Distance:</strong> ${distance} | <strong>ETA:</strong> ${duration}</p>`;

    html += `<table border="1" cellpadding="6"><tr><th>Name</th><th>Vehicle</th><th>Class</th><th>Rating</th></tr>`;

    if (drivers.length === 0) {
      html += `<tr><td colspan="4">No drivers available for ${vehicle}</td></tr>`;
    } else {
      drivers.forEach(driver => {
        html += `
          <tr>
            <td>${driver.name}</td>
            <td>${driver.vehicle_type}</td>
            <td>${driver.vehicle_class}</td>
            <td>${driver.rating}</td>
          </tr>
        `;
      });
    }

    html += `</table>`;
    res.send(html);

  } catch (err) {
    console.error('❌ Error processing request:', err.message);
    res.status(500).send('Server error occurred');
  }
});

// 🧪 Optional JSON version
app.post('/api/request-ride', async (req, res) => {
  const { pickup, vehicle } = req.body;

  try {
    const mapsRes = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: pickup,
        destinations: 'Times Square, New York',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const mapData = mapsRes.data.rows[0].elements[0];
    const distance = mapData?.distance?.text || 'N/A';
    const duration = mapData?.duration?.text || 'N/A';

    const result = await pool.query(
      'SELECT name, vehicle_type, vehicle_class, rating FROM drivers WHERE vehicle_class = $1 AND is_available = true',
      [vehicle]
    );

    res.json({
      pickup,
      destination: 'Times Square, New York',
      distance,
      duration,
      drivers: result.rows
    });

  } catch (err) {
    console.error('❌ Error processing API request:', err.message);
    res.status(500).json({ error: 'Server error occurred' });
  }
});

// ✅ Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server 2 is running on port ${PORT}`);
});
