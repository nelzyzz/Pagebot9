const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  name: 'poli',
  description: 'Generate image from Pollinations',
  author: 'jameslim',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    if (!query) {
      return sendMessage(senderId, { text: 'Please provide a text/query.' }, pageAccessToken);
    }

    const path = __dirname + `/cache/poli.png`;

    try {
      const response = await axios.get(`https://image.pollinations.ai/prompt/${query}`, {
        responseType: 'arraybuffer',
      });

      fs.writeFileSync(path, Buffer.from(response.data, 'utf-8'));

      await sendMessage(senderId, {
        body: 'Here is what I generated...',
        attachment: fs.createReadStream(path)
      }, pageAccessToken);

      fs.unlinkSync(path);

    } catch (error) {
      console.error('Error generating image from Pollinations:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error generating the image. Please try again later.' }, pageAccessToken);
    }
  }
};