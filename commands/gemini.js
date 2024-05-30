const { callGeminiAPI } = require('../utils/callGeminiAPI');

module.exports = {
  name: 'gemini',
  description: 'Ask a question to the Gemini AI',
  author: 'ChatGPT',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');
    try {
      sendMessage(senderId, { text: 'Please wait, I am processing your request...' }, pageAccessToken);
      const response = await callGeminiAPI(prompt);
      sendMessage(senderId, { text: response }, pageAccessToken);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};