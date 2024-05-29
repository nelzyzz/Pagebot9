const axios = require('axios');

// Call the Sumi API
function callSumiAPI(question, apiKey) {
  return axios.get('https://liaspark.chatbotcommunity.ltd/@LianeAPI_Reworks/api/sumi', {
    params: {
      key: apiKey,
      query: question,
    }
  })
  .then(response => response.data.message)
  .catch(error => {
    throw error;
  });
}

module.exports = {
  callSumiAPI
};