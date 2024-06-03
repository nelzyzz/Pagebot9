const axios = require('axios');

module.exports = {
  name: 'pinterest',
  description: 'Fetch images from Pinterest based on a query',
  author: 'Deku',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://deku-rest-api-3ijr.onrender.com/api/pinterest?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const images = response.data.result;

      if (images && images.length > 0) {
        // Create elements for gallery template
        const elements = images.slice(0, 10).map(imageUrl => ({
          title: 'Pinterest Image',
          image_url: imageUrl,
          subtitle: 'Image from Pinterest',
          default_action: {
            type: 'web_url',
            url: imageUrl,
            messenger_extensions: false,
            webview_height_ratio: 'full'
          }
        }));

        // Create gallery template message
        const galleryMessage = {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: elements
            }
          }
        };

        // Send gallery message
        sendMessage(senderId, galleryMessage, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'No images found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error fetching Pinterest images:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};