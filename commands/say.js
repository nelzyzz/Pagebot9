const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'say',
  description: 'Text to voice speech messages',
  author: 'Yan Maglinte',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      const content = args.join(' ');
      const languageToSay = (["ru", "en", "ko", "ja", "tl"].some(item => content.indexOf(item) == 0)) ? content.slice(0, content.indexOf(" ")) : 'en';
      const msg = (languageToSay !== 'en') ? content.slice(3) : content;
      const filePath = path.resolve(__dirname, 'cache', `${senderId}.mp3`);
      
      const response = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${languageToSay}&client=tw-ob`, { responseType: 'arraybuffer' });
      
      fs.writeFileSync(filePath, Buffer.from(response.data, 'utf-8'));
      
      const attachment = {
        attachment: fs.createReadStream(filePath),
      };
      
      await sendMessage(senderId, attachment, pageAccessToken);
      fs.unlinkSync(filePath);
      
    } catch (error) {
      console.error('Error generating speech:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error generating the speech. Please try again later.' }, pageAccessToken);
    }
  }
};