const axios = require('axios');

async function callGPT4API(input, senderId) {
  try {
    const response = await axios.get(`https://deku-rest-api-ywad.onrender.com/gpt4`, {
      params: { prompt: input, uid: senderId }
    });

    const title = response.data.trim(); // Assuming the API returns just the title
    return title;
  } catch (error) {
    console.error('Error calling GPT-4 API:', error);
    throw new Error('Error calling GPT-4 API');
  }
}

module.exports = {
  callGPT4API,
};