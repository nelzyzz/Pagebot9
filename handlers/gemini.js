const axios = require('axios');

// Call the Gemini API
function callGeminiAPI(prompt) {
  const apiUrl = `https://gemini-yvcl.onrender.com/api/ai/chat?prompt=${encodeURIComponent(prompt)}&id=40`;

  return axios.get(apiUrl)
    .then(response => response.data.response)
    .catch(error => {
      throw error;
    });
}

module.exports = {
  callGeminiAPI
};