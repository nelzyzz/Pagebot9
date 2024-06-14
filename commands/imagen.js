const axios = require('axios');

module.exports = {
  name: 'imagen',
  description: 'Generate an image based on a prompt',
  author: 'Adrian',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    try {
      const apiUrl = `https://imagen-9n6s.onrender.com/generate-image?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const imageUrl = response.data.response;

      if (imageUrl) {
        const imageMessage = {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        };
        await sendMessage(senderId, imageMessage, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: 'Sorry, I couldn\'t generate an image based on that prompt.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};