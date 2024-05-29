const { sendMessage, callSumiAPI } = require('./gemini'); // Adjust the path as needed

const triggers = ['gemini', 'hi', 'hello', 'help', 'how are you', 'what\'s up', 'sumi'];

// Function to handle the help command
function handleHelpCommand(senderId, sendMessage) {
  const helpMessage = "Here are all available commands:\n- hi\n- hello\n- help\n- how are you\n- what's up\n- gemini";
  sendMessage(senderId, { text: helpMessage });
}

// Handle incoming messages
function handleMessage(event, userTokenMap) {
  const senderId = event.sender.id;
  const pageId = event.recipient.id; // Assuming the recipient ID is the page ID
  const messageText = event.message.text.toLowerCase();

  // Retrieve the corresponding token for the pageId
  const token = userTokenMap[pageId];

  if (!token) {
    sendMessage(senderId, { text: 'Sorry, no token found for this page.' }, userTokenMap);
    return;
  }

  if (triggers.some(trigger => messageText.includes(trigger))) {
    if (messageText.includes('help')) {
      handleHelpCommand(senderId, sendMessage);
    } else {
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, userTokenMap);
      callSumiAPI(messageText, 'j86bwkwo-8hako-12C') // Provide your API key here
        .then(response => {
          sendMessage(senderId, { text: response }, userTokenMap);
        })
        .catch(error => {
          console.error('Error calling Sumi API:', error);
          sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, userTokenMap);
        });
    }
  }
}

module.exports = {
  handleMessage,
  triggers
};