const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = 'c14eecb38eba4ff9a8f09782c98543dc';
const CLIENT_SECRET = '87e7463158df49539b7963cef419e9e8';

let cachedToken = null;
let tokenExpiresAt = 0;

app.get('/get-token', async (req, res) => {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    // Serve cached token if still valid
    return res.json({
      access_token: cachedToken,
      token_type: 'Bearer',
      expires_in: Math.floor((tokenExpiresAt - now) / 1000)
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early

    res.json(response.data);
  } catch (err) {
    console.error('Error fetching token:', err);
    res.status(500).send('Error getting token');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
