const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

// Call the Gemini API
function callGeminiAPI(prompt) {
  const apiUrl = `https://gemini-yvcl.onrender.com/api/ai/chat?prompt=${encodeURIComponent(prompt)}&id=40`;

  return axios.get(apiUrl)
    .then(response => response.data.response)
    .catch(error => {
      throw error;
    });
}

// Send a message to the sender using the associated token
async function sendMessage(senderId, message, userTokenMap) {
  const tokensDirPath = path.join(__dirname, '../tokens');
  const tokenName = userTokenMap[senderId];

  if (tokenName) {
    const tokenFilePath = path.join(tokensDirPath, `${tokenName}.json`);
    try {
      const data = await fs.readFile(tokenFilePath, 'utf8');
      const tokenObj = JSON.parse(data);
      const PAGE_ACCESS_TOKEN = tokenObj.token;

      await axios.post(`https://graph.facebook.com/v13.0/me/messages`, {
        recipient: { id: senderId },
        message: message,
      }, {
        params: { access_token: PAGE_ACCESS_TOKEN }
      });

      console.log(`Message sent successfully to user ${senderId} with token: ${tokenName}`);
    } catch (error) {
      console.error(`Error sending message to user ${senderId} with token ${tokenName}:`, error);
    }
  } else {
    console.error(`No token found for user ${senderId}`);
  }
}

module.exports = {
  callGeminiAPI,
  sendMessage
};