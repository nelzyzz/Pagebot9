const fs = require('fs');
const axios = require('axios');

const petDataPath = './data/petData.json';
let petData = {};
const hungerDecreaseInterval = 60 * 60 * 1000; // 1 hour
const sleepCheckInterval = 5 * 60 * 60 * 1000; // 5 hours
//let timer = null;

// Load pet data from the JSON file
function loadPetData() {
  if (fs.existsSync(petDataPath)) {
    petData = JSON.parse(fs.readFileSync(petDataPath));
  }
}

// Save pet data to the JSON file
function savePetData() {
  fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 2));
}

// Function to generate a status bar for pet attributes
function generateStatusBar(attribute, value) {
  const barLength = 10;
  const filledLength = Math.round((value / 100) * barLength);
  const emptyLength = barLength - filledLength;
  return `${attribute}: [${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}] ${value}%`;
}

// Function to decrease hunger
function decreaseHunger() {
  for (const ownerId in petData) {
    if (petData[ownerId].hunger > 0) {
      petData[ownerId].hunger -= 10;
      if (petData[ownerId].hunger < 0) petData[ownerId].hunger = 0;
      if (petData[ownerId].hunger === 0) petData[ownerId].isSick = true;

      // Send a message if hunger is critically low
      if (petData[ownerId].hunger <= 20) {
        sendMessage(ownerId, { text: `⚠️ ${petData[ownerId].name} is very hungry! Please feed it.` }, petData[ownerId].pageAccessToken);
      }
    }
  }
  savePetData();
}

// Function to check if the pet needs sleep
function checkSleep() {
  for (const ownerId in petData) {
    if (petData[ownerId].energy <= 0) {
      petData[ownerId].isSick = true;
      sendMessage(ownerId, { text: `😴 ${petData[ownerId].name} is very tired and got sick. Please let it sleep.` }, petData[ownerId].pageAccessToken);
    }
  }
  savePetData();
}

// Function to send messages in chunks
async function sendResponseInChunks(senderId, text, pageAccessToken, sendMessage) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

// Function to split a message into chunks
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  let chunk = '';
  const words = message.split(' ');

  for (const word of words) {
    if ((chunk + word).length > chunkSize) {
      chunks.push(chunk.trim());
      chunk = '';
    }
    chunk += `${word} `;
  }

  if (chunk) {
    chunks.push(chunk.trim());
  }

  return chunks;
}
// Map of emojis to their hunger values
const emojiHungerMap = {
  '🍓': 10, '🍒': 8, '🍎': 7, '🍉': 6, '🍑': 7, '🍊': 5, '🥭': 9, '🍍': 8, '🍋': 6, '🍋‍': 6,
  '🍈': 6, '🍏': 7, '🍐': 7, '🥝': 8, '🫒': 6, '🫐': 9, '🍇': 7, '🥥': 6, '🍅': 5, '🌶️': 7, '🫚': 7,
  '🥕': 6, '🧅': 5, '🌽': 6, '🥦': 7, '🥒': 5, '🥬': 6, '🫛': 6, '🫑': 7, '🥑': 8, '🍠': 6, '🍆': 6,
  '🧄': 4, '🥔': 5, '🍄‍': -5, '🫘': -4, '🌰': 4, '🥜': 5, '🍞': 6, '🫓': 5, '🥐': 6, '🥖': 6, '🥯': 5,
  '🧇': 7, '🥞': 7, '🍳': 8, '🥚': 5, '🧀': 7, '🥓': 8, '🥩': 9, '🍗': 8, '🍖': 9, '🍔': 8, '🌭': 7,
  '🥪': 7, '🥨': 7, '🍟': 6, '🍕': 6, '🫔': 6, '🌮': 8, '🌯': 8, '🥙': 8, '🧆': 7, '🥘': 7, '🍝': 9,
  '🥫': 7, '🫕': 7, '🥗': 6, '🥣': 7, '🍲': 8, '🍛': 9, '🍜': 9, '🦪': 9, '🦞': 9, '🍣': 8, '🍤': 8,
  '🥠': 6, '🍚': 7, '🍱': 8, '🥟': 8, '🥡': 7, '🍢': 7, '🍙': 6, '🍘': 6, '🍥': 5, '🍡': 5, '🥮': 8,
  '🍧': 6, '🍨': 7, '🍦': 7, '🥧': 8, '🍰': 8, '🍮': 7, '🎂': 8, '🧁': 7, '🍭': 6, '🍫': 7, '🍫': 7,
  '🍩': 6, '🍪': 6, '🍯': 6, '🧂': 5, '🧈': 6, '🍿': 5, '🧊': 5, '🫙': 6, '🥤': 6, '🧋': 6, '🧃': 5,
  '🥛': 5, '🍼': 5, '🥃': 7, '☕': 6, '🫗': 6, '🫖': 5, '🍵': 6, '🍸': 7, '🍹': 7, '🧉': 6, '🍺': 7,
  '🍶': 8, '🍷': 7, '🍾': 8, '🥂': 7, '🍻': 8, '🥃': 7,
};

let timer;

module.exports = {
  name: 'pet',
  description: 'Interact with your virtual pet',
  author: 'Adrian',
  execute(senderId, args, pageAccessToken, sendMessage) {
    const action = args[0];
    
    // Check if an action was provided
    if (!action) {
      sendMessage(senderId, { text: 'Please provide an action for your pet, e.g., feed, play, sleep, status, rename, delete, call, help.' }, pageAccessToken);
      return;
    }

    // Load pet data from the JSON file
    let petData;
    try {
      petData = JSON.parse(fs.readFileSync(petDataPath, 'utf8'));
    } catch (error) {
      petData = {};
    }

    // Function to save pet data to the JSON file
    function savePetData() {
      fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 2));
    }

    // Function to generate a status bar for pet attributes
    function generateStatusBar(attribute, value) {
      const totalBars = 20;
      const filledBars = Math.round((value / 100) * totalBars);
      const emptyBars = totalBars - filledBars;
      return `${attribute}: [${'█'.repeat(filledBars)}${'░'.repeat(emptyBars)}] ${value}/100`;
    }

    // Function to decrease hunger over time
    function decreaseHunger() {
      Object.keys(petData).forEach(id => {
        petData[id].hunger -= 5;
        if (petData[id].hunger < 0) petData[id].hunger = 0;
        if (petData[id].hunger <= lowHungerThreshold) {
          sendMessage(id, { text: `Your pet ${petData[id].name} is hungry! Please feed it.` }, pageAccessToken);
        }
        if (petData[id].hunger === 0) {
          petData[id].isSick = true;
          sendMessage(id, { text: `Your pet ${petData[id].name} is sick due to hunger. Please cure it with medicine.` }, pageAccessToken);
        }
      });
      savePetData();
    }

    // Function to check if pets need to sleep
    function checkSleep() {
      Object.keys(petData).forEach(id => {
        petData[id].energy -= 5;
        if (petData[id].energy < 0) petData[id].energy = 0;
        if (petData[id].energy <= lowEnergyThreshold) {
          sendMessage(id, { text: `Your pet ${petData[id].name} is very tired! It needs to sleep.` }, pageAccessToken);
        }
        if (petData[id].energy === 0) {
          petData[id].isSick = true;
          sendMessage(id, { text: `Your pet ${petData[id].name} is sick due to lack of sleep. Please let it rest.` }, pageAccessToken);
        }
      });
      savePetData();
    }

    // Function to perform an action based on user input
    function performAction(action, senderId, args) {
      const petName = petData[senderId]?.name;
      switch (action) {
        case 'new':
          if (!args[1]) {
            sendMessage(senderId, { text: 'Please provide a name for your new pet.' }, pageAccessToken);
            return;
          }
          petData[senderId] = {
            name: args[1],
            owner: senderId, // Add owner field
            hunger: 100,
            energy: 100,
            isSick: false
          };
          sendMessage(senderId, { text: `You have a new pet named ${args[1]}!` }, pageAccessToken);
          break;

        case 'feed':
          if (!args[1] || !emojiHungerMap[args[1]]) {
            sendMessage(senderId, { text: 'Please provide a valid food emoji to feed your pet.' }, pageAccessToken);
            return;
          }
          petData[senderId].hunger += emojiHungerMap[args[1]];
          if (petData[senderId].hunger > 100) petData[senderId].hunger = 100;
          if (petData[senderId].isSick && petData[senderId].hunger > 0) petData[senderId].isSick = false;
          sendMessage(senderId, { text: `You fed ${petName} ${args[1]}!` }, pageAccessToken);
          break;

        case 'play':
          petData[senderId].energy -= 10;
          if (petData[senderId].energy < 0) petData[senderId].energy = 0;
          if (petData[senderId].energy === 0) {
            petData[senderId].isSick = true;
            sendMessage(senderId, { text: `${petName} is exhausted and got sick. Please let it rest.` }, pageAccessToken);
          } else {
            sendMessage(senderId, { text: `You played with ${petName}!` }, pageAccessToken);
          }
          break;

        case 'sleep':
          petData[senderId].energy += 20;
          if (petData[senderId].energy > 100) petData[senderId].energy = 100;
          if (petData[senderId].isSick && petData[senderId].energy > 0) petData[senderId].isSick = false;
          sendMessage(senderId, { text: `${petName} is sleeping and regaining energy.` }, pageAccessToken);
          break;

        case 'status':
          if (!petData[senderId]) {
            sendMessage(senderId, { text: 'You do not have a pet. Use the "new" command to get one.' }, pageAccessToken);
            return;
          }
          const hungerStatus = generateStatusBar('Hunger', petData[senderId].hunger);
          const energyStatus = generateStatusBar('Energy', petData[senderId].energy);
          const healthStatus = petData[senderId].isSick ? 'Health: Sick' : 'Health: Healthy';
          sendMessage(senderId, { text: `Status of ${petName}:\n${hungerStatus}\n${energyStatus}\n${healthStatus}` }, pageAccessToken);
          break;

        case 'rename':
          if (!args[1]) {
            sendMessage(senderId, { text: 'Please provide a new name for your pet.' }, pageAccessToken);
            return;
          }
          const oldName = petData[senderId].name;
          petData[senderId].name = args[1];
          sendMessage(senderId, { text: `Your pet has been renamed from ${oldName} to ${args[1]}.` }, pageAccessToken);
          break;

        case 'delete':
          delete petData[senderId];
          sendMessage(senderId, { text: 'Your pet has been deleted.' }, pageAccessToken);
          break;

        case 'call':
          sendMessage(senderId, { text: `Here is your pet, ${petName}!` }, pageAccessToken);
          break;

        case 'help':
          sendMessage(senderId, {
            text: `Available commands:\n
            new [name] - Create a new pet with the specified name.\n
            feed [emoji] - Feed your pet with the specified food emoji.\n
            play - Play with your pet.\n
            sleep - Let your pet sleep.\n
            status - Get the current status of your pet.\n
            rename [new name] - Rename your pet.\n
            delete - Delete your pet.\n
            call - Call your pet to see it.\n
            help - Show this help message.`
          }, pageAccessToken);
          break;

        default:
          sendMessage(senderId, { text: 'Unknown command. Use "help" to see the list of available commands.' }, pageAccessToken);
          break;
      }
      savePetData();
    }

    performAction(action, senderId, args);
  }
};

// Initialize intervals for hunger decrease and sleep check
if (!timer) {
  timer = setInterval(decreaseHunger, hungerDecreaseInterval);
  setInterval(checkSleep, sleepCheckInterval);
}