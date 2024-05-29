const { sendMessage, callGeminiAPI } = require('./gemini');

const triggers = ['gemini', 'hi', 'hello', 'help', 'how are you', 'what\'s up'];

// Handle incoming messages
function handleMessage(event, userTokenMap) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase();

  // Store the senderId with a corresponding token (example logic)
  userTokenMap[senderId] = 'token1'; // Replace with actual logic to determine the correct token

  if (triggers.some(trigger => messageText.includes(trigger))) {
    sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, userTokenMap);

    callGeminiAPI(messageText)
      .then(response => {
        sendMessage(senderId, { text: response }, userTokenMap);
      })
      .catch(error => {
        console.error('Error calling Gemini API:', error);
        sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, userTokenMap);
      });
  }
}

module.exports = {
  handleMessage
};