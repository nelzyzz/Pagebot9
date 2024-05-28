const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());

// Set the verify token for the webhook
const VERIFY_TOKEN = 'pagebot';

// Verify that the verify token matches
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

// Handle messages
function handleMessage(event) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase();

  // Define triggers for responses
  const triggers = ['gemini', 'hi', 'hello', 'help', 'how are you', 'what\'s up'];

  // Check if any trigger is found in the message
  if (triggers.some(trigger => messageText.includes(trigger))) {
    // Send a loading message
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' });

    // Call the Gemini API
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
    
    request(apiUrl, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        const responseBody = JSON.parse(body);
        resolve(responseBody.response);
      }
    });
  });
}

// Handle postbacks
function handlePostback(event) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  // Send a message back to the sender
  sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` });
}

// Send a message to the sender
function sendMessage(senderId, message) {
  request({
    url: 'https://graph.facebook.com/v13.0/me/messages',
    qs: { access_token: 'EAAMMIEgswYQBO6ahqZBhFJkqshXjZBBCAx8i1pwmcKOloMJYoaaQ5CI82S2E8hsuF0iW7UgZAoao8lfCidxb3uP4eZCdYEnLPek7Hu7BF3BbXI6NfYX3V1MCGGmZCFZAf5yKSOAS7EvQYLOMrumwZC9wL21SqGCKBGzakF1NQzCrX3L3kqtZC45WjS096mubOyA2Y8Pe6dhAugZDZD' },
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
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});