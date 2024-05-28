const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Set the verify token directly
const VERIFY_TOKEN = 'pagebot';

// Verify webhook
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

// Define a variable to store the number of active bots
let activeBots = 0;

// Function to update the active bots count
function updateActiveBotsCount(newCount) {
  activeBots = newCount;
}

// Assume you have an array or some other data structure to keep track of active bot IDs
let activeBotIds = [];

// Function to update the active bots count
function updateActiveBotsCount() {
  return activeBotIds.length;
}

// Endpoint to fetch the number of active bots
app.get('/getActiveBots', (req, res) => {
  const activeBotsCount = updateActiveBotsCount();
  res.json({ botNumber: activeBotsCount });
});

// Example of how you might add or remove active bots (this could be triggered by some event in your application)
activeBotIds.push('bot1'); // Add a new active bot

// Handle messages and postbacks
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

// Handle form submission
app.post('/setToken', (req, res) => {
  const token = req.body.token;
  if (token) {
    // Generate a unique filename for the token JSON file
    const tokenFileName = `${token}.json`;
    const tokenFilePath = path.join(__dirname, 'tokens', tokenFileName);

    // Check if the token file already exists
    fs.access(tokenFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        // If token file does not exist, save the token
        fs.writeFile(tokenFilePath, JSON.stringify({ token }), (writeErr) => {
          if (writeErr) {
            console.error('Error saving token:', writeErr);
            res.status(500).json({ message: 'Internal server error.' });
          } else {
            res.json({ message: 'Page Access Token set and saved successfully!' });
          }
        });
      } else {
        // If token file already exists, send an alert
        res.status(200).json({ message: 'This token is already saved.' });
      }
    });
  } else {
    res.status(400).json({ message: 'Please provide a valid token.' });
  }
});

// Handle messages
function handleMessage(event) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase();

  const triggers = ['gemini', 'hi', 'hello', 'help', 'how are you', 'what\'s up'];

  if (triggers.some(trigger => messageText.includes(trigger))) {
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' });

    callGeminiAPI(messageText)
      .then(response => {
        sendMessage(senderId, { text: response });
      })
      .catch(error => {
        console.error('Error calling Gemini API:', error);
        sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' });
      });
  }
}

// Call the Gemini API
function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://gemini-yvcl.onrender.com/api/ai/chat?prompt=${encodeURIComponent(prompt)}&id=40`;

    axios.get(apiUrl)
      .then(response => {
        resolve(response.data.response);
      })
      .catch(error => {
        reject(error);
      });
  });
}

// Handle postbacks
function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` });
}

// Send a message to the sender using all tokens
function sendMessage(senderId, message) {
  const tokensDirPath = path.join(__dirname, 'tokens');
  
  // Read the tokens directory
  fs.readdir(tokensDirPath, (err, files) => {
    if (err) {
      console.error('Error reading tokens directory:', err);
      return;
    }

    // Iterate over each token file and send the message
    files.forEach(file => {
      const tokenFilePath = path.join(tokensDirPath, file);
      fs.readFile(tokenFilePath, 'utf8', (readErr, data) => {
        if (readErr) {
          console.error('Error reading token file:', readErr);
          return;
        }

        try {
          const tokenObj = JSON.parse(data);
          const PAGE_ACCESS_TOKEN = tokenObj.token;

          request({
            url: 'https://graph.facebook.com/v13.0/me/messages',
            qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: {
              recipient: { id: senderId },
              message: message,
            },
          }, (error, response, body) => {
            if (error) {
              console.error('Error sending message:', error);
            } else if (response.body.error) {
              console.error('Error response:', response.body.error);
            } else {
              console.log('Message sent successfully:', body);
            }
          });
        } catch (parseError) {
          console.error('Error parsing token data:', parseError);
        }
      });
    });
  });
}

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});