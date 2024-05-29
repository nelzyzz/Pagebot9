const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { handleMessage } = require('./handlers/commands');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const VERIFY_TOKEN = 'pagebot';

// Endpoint to get active bot count
app.get('/getActiveBots', async (req, res) => {
  try {
    const tokensDir = path.join(__dirname, 'tokens');
    const files = await fs.readdir(tokensDir);
    const activeBotCount = files.length;
    res.json({ botNumber: activeBotCount });
  } catch (err) {
    console.error('Error fetching active bot count:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

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
          handleMessage(event);
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

// Handle postbacks
function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` });
}

// Serve the HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tutorial', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutorial.html'));
});

// Function to send messages using Page Access Token from token files
async function sendMessage(senderId, message) {
  const tokensDirPath = path.join(__dirname, 'tokens');

  try {
    // Read the list of token files
    const files = await fs.readdir(tokensDirPath);

    // Determine the next token file name based on the number of existing files
    const nextTokenIndex = files.length + 1;
    const tokenFileName = `token${nextTokenIndex}.json`;
    const tokenFilePath = path.join(tokensDirPath, tokenFileName);

    // Check if the token file exists
    await fs.access(tokenFilePath);

    // If the token file exists, read the token from the file
    const data = await fs.readFile(tokenFilePath, 'utf8');
    const tokenObj = JSON.parse(data);
    const PAGE_ACCESS_TOKEN = tokenObj.token;

    // Send the message using the retrieved token
    await axios.post(`https://graph.facebook.com/v13.0/me/messages`, {
      recipient: { id: senderId },
      message: message,
    }, {
      params: { access_token: PAGE_ACCESS_TOKEN }
    });

    console.log(`Message sent successfully to user ${senderId}`);
  } catch (error) {
    console.error(`Error sending message to user ${senderId}:`, error);
  }
}

module.exports = app;