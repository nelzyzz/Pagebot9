const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { handleMessage } = require('./handlers/commands');
const { sendMessage } = require('./handlers/gemini');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const VERIFY_TOKEN = 'pagebot';

// In-memory storage for user-token mapping
const userTokenMap = {};

// Middleware to verify webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Function to handle incoming messages and postbacks
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message) {
          handleMessage(event, userTokenMap);
        } else if (event.postback) {
          handlePostback(event);
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Endpoint to set token
app.post('/setToken', async (req, res) => {
  const token = req.body.token;
  if (token) {
    const tokenFileName = `${token}.json`;
    const tokenFilePath = path.join(__dirname, 'tokens', tokenFileName);

    try {
      await fs.access(tokenFilePath);
      res.status(200).json({ message: 'This token is already saved.' });
    } catch (err) {
      try {
        await fs.writeFile(tokenFilePath, JSON.stringify({ token }));
        res.json({ message: 'Page Access Token set and saved successfully!' });
      } catch (writeErr) {
        console.error('Error saving token:', writeErr);
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  } else {
    res.status(400).json({ message: 'Please provide a valid token.' });
  }
});

// Handle postbacks
function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, userTokenMap);
}

// Serve the HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tutorial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutorial.html'));
});

module.exports = app;