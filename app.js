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

// Health check
app.get('/', (req, res) => {
  res.send('🚦 Server 2 is alive and listening!');
});

// 🚗 Ride request HTML response
app.post('/request-ride', async (req, res) => {
  const { pickup, dropoff, vehicle } = req.body;
  console.log('📥 Ride requested:', req.body);

  try {
    // 📍 Call Distance Matrix API for ETA + distance
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

    // 💵 Fare calculation
    let fareEstimate = 'N/A';
    if (distance !== 'N/A') {
      const miles = parseFloat(distance.replace(' mi', ''));
      fareEstimate = (2.25 + miles * 1.75).toFixed(2);
    }

    // 🚙 Get available drivers from DB
    const result = await pool.query(
      'SELECT name, vehicle_type, vehicle_class, rating FROM drivers WHERE vehicle_class = $1 AND is_available = true',
      [vehicle]
    );

    const drivers = result.rows;

    // 📄 Build HTML response
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Available ${vehicle} Drivers</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #000;
      color: #fff;
      padding: 2rem;
      margin: 0;
    }
    .logo {
      display: block;
      margin: 0 auto 20px auto;
      width: 140px;
      filter: invert(1);
    }
    h1 {
      text-align: center;
      font-weight: 500;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    p {
      text-align: center;
      margin: 0.5rem 0;
      font-size: 1.05rem;
    }
    table {
      width: 90%;
      max-width: 800px;
      margin: 2rem auto;
      background-color: #1c1c1e;
      border-collapse: collapse;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
    }
    th, td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid #333;
    }
    th {
      background-color: #2c2c2e;
      color: #ccc;
      font-weight: 500;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background-color: #2a2a2a;
    }
    .centered {
      text-align: center;
      font-style: italic;
      color: #aaa;
    }
    #map {
      height: 400px;
      width: 90%;
      max-width: 800px;
      margin: 2rem auto;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="Uber Logo" />
  <h1>Available ${vehicle} Drivers</h1>
  <p><strong>Pickup:</strong> ${pickup}</p>
  <p><strong>Dropoff:</strong> ${dropoff}</p>
  <p><strong>Distance:</strong> ${distance} | <strong>ETA:</strong> ${duration}</p>
  <p><strong>Fare Estimate:</strong> $${fareEstimate}</p>

  <div id="map"></div>

  <table>
    <tr>
      <th>Name</th>
      <th>Vehicle</th>
      <th>Class</th>
      <th>Rating</th>
    </tr>`;

    if (drivers.length === 0) {
      html += `
        <tr>
          <td colspan="4" class="centered">No drivers available for ${vehicle}</td>
        </tr>`;
    } else {
      drivers.forEach(driver => {
        html += `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.vehicle_type}</td>
          <td>${driver.vehicle_class}</td>
          <td>${driver.rating}</td>
        </tr>`;
      });
    }

    html += `
  </table>

  <script>
    const pickup = ${JSON.stringify(pickup)};
    const dropoff = ${JSON.stringify(dropoff)};

    function initMap() {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: 40.7580, lng: -73.9855 }
      });

      directionsRenderer.setMap(map);

      const request = {
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
        } else {
          console.error("Directions failed:", status);
        }
      });
    }
  </script>

  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=places">
  </script>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('Server error occurred');
  }
});

// 🧪 Optional JSON API version
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
    console.error('❌ API error:', err.message);
    res.status(500).json({ error: 'Server error occurred' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server 2 is running on port ${PORT}`);
});
