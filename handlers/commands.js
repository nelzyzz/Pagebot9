const { sendMessage, callSumiAPI } = require('./sumi'); // Adjust the path as needed
const { callGeminiAPI } = require('./gemini')

const triggers = ['gemini', 'hi', 'hello', 'help', 'how are you', 'what\'s up'];

// Function to handle the help command
function handleHelpCommand(pageId, sendMessage) {
  const helpMessage = "Here are all available commands:\n- hi\n- hello\n- help\n- how are you\n- what's up\n- gemini";
  sendMessage(pageId, { text: helpMessage });
}

// Handle incoming messages
function handleMessage(event, userTokenMap) {
  const senderId = event.sender.id;
  const pageId = event.recipient.id; // Assuming the recipient ID is the page ID
  const messageText = event.message.text.toLowerCase();

  console.log('Received message:', messageText);

  if (triggers.some(trigger => messageText.includes(trigger))) {
    if (messageText.includes('help')) {
      console.log('Handling help command...');
      handleHelpCommand(pageId, sendMessage);
    } else {
      console.log('Processing request...');
      sendMessage(pageId, { text: 'Please wait, I am processing your request...' }, userTokenMap);
      callSumiAPI(messageText, 'j86bwkwo-8hako-12C') // Provide your API key here
        .then(response => {
          console.log('API response:', response);
          sendMessage(pageId, { text: response }, userTokenMap);
        })
        .catch(error => {
          console.error('Error calling Sumi API:', error);
          sendMessage(pageId, { text: 'Sorry, there was an error processing your request.' }, userTokenMap);
        });
    }
  }
}

module.exports = {
  handleMessage,
  triggers
};