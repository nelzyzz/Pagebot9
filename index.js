const app = require('./app');
const path = require('path');
const fs = require('fs').promises;

// Ensure the tokens directory exists
const tokensDirPath = path.join(__dirname, 'tokens');
fs.mkdir(tokensDirPath, { recursive: true })
  .then(() => {
    console.log(`Tokens directory created or already exists at ${tokensDirPath}`);
  })
  .catch(error => {
    console.error('Error creating tokens directory:', error);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});