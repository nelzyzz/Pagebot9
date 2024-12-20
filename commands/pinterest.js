const axios = require('axios');

module.exports = {
  name: 'pinterest',
  description: 'Fetch images from Pinterest based on a query',
  author: 'Deku',
  role: 1,
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://deku-rest-api-ywad.onrender.com/api/pinterest?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const images = response.data.result;

      if (images && images.length > 0) {
        for (const imageUrl of images) {
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
        }
      } else {
        await sendMessage(senderId, { text: 'No images found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Pinterest images:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};