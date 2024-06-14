const axios = require('axios');

async function callLyricsAPI(title) {
  try {
    const apiUrl = `https://lyricsapi-1ays.onrender.com/search?q=${encodeURIComponent(title)}`;
    const response = await axios.get(apiUrl);
    const result = response.data;

    if (result && result.lyrics) {
      return {
        title: result.title,
        artist: result.artist,
        album: result.album,
        lyrics: result.lyrics,
        image: result.image
      };
    } else {
      console.error('Error: No lyrics found in the response.');
      return null;
    }
  } catch (error) {
    console.error('Error calling Lyrics API:', error);
    throw new Error('Error calling Lyrics API');
  }
}

module.exports = {
  callLyricsAPI,
};