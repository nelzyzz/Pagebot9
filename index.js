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
    // Save the token to a JSON file (assuming tokens.json in the same directory)
    const tokensFilePath = path.join(__dirname, 'tokens.json');
    let tokens = [];
    try {
      // Load existing tokens from the file
      tokens = require(tokensFilePath);
    } catch (error) {
      // File does not exist or is empty
    }

    // Check if the token already exists
    const tokenExists = tokens.some(tokenObj => tokenObj.token === token);

    if (tokenExists) {
      // If token already exists, send an alert and do not save the new token
      res.status(200).json({ message: 'This token is already saved.' });
    } else {
      // Add the new token to the tokens array
      tokens.push({ token });

      // Write the updated tokens array back to the file
      fs.writeFile(tokensFilePath, JSON.stringify(tokens, null, 2), (err) => {
        if (err) {
          console.error('Error saving token:', err);
          res.status(500).json({ message: 'Internal server error.' });
        } else {
          res.json({ message: 'Page Access Token set and saved successfully!' });
        }
      });
    }
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
  const tokensFilePath = path.join(__dirname, 'tokens.json');
  
  // Load tokens from tokens.json
  fs.readFile(tokensFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tokens file:', err);
      return;
    }

    try {
      // Parse JSON data
      const tokens = JSON.parse(data);

      // Iterate over each token and send the message
      tokens.forEach(tokenObj => {
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
      });
    } catch (error) {
      console.error('Error parsing tokens data:', error);
    }
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