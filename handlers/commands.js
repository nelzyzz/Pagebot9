const { callGeminiAPI } = require('./gemini')

const { callSumiAPI } = require('./sumi');

const triggers = ['hi', 'hello', 'help', 'how are you', 'what\'s up', 'gemini', 'sumi'];

// Function to handle the help command
function handleHelpCommand(senderId) {
  const helpMessage = "Here are all available commands:\n" + triggers.join("\n- ");
  sendMessage(senderId, { text: helpMessage });
}

// Handle incoming messages
function handleMessage(event) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase();

  console.log('Received message:', messageText);

  if (triggers.some(trigger => messageText.includes(trigger))) {
    if (messageText.includes('help')) {
      console.log('Handling help command...');
      handleHelpCommand(senderId);
    } else {
      console.log('Processing request...');
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' });
      callSumiAPI(messageText, 'j86bwkwo-8hako-12C')
        .then(response => {
          console.log('API response:', response);
          sendMessage(senderId, { text: response });
        })
        .catch(error => {
          console.error('Error calling Sumi API:', error);
          sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' });
        });
    }
  }
}

module.exports = {
  handleMessage,
  triggers
};