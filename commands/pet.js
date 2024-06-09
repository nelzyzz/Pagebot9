const fs = require('fs');

const petDataPath = './data/petData.json';
const hungerDecreaseInterval = 3600000; // 1 hour in milliseconds
const sleepCheckInterval = 18000000; // 5 hours in milliseconds
const lowHungerThreshold = 30; // Threshold for low hunger level
const lowEnergyThreshold = 20; // Threshold for low energy level

// Map of emojis to their hunger values
const emojiHungerMap = {
  '🍓': 20, '🍒': 5, '🍎': 5, '🍉': 14, '🍑': 5, '🍊': 5, '🥭': 5, '🍍': 21, '🍍': 5, '🍋': 12, '🍋‍': 5,
  '🍈': 5, '🍏': 5, '🍐': 5, '🥝': 4, '🫒': 5, '🫐': 5, '🍇': 5, '🥥': 1, '🍅': 3, '🌶️': 5, '🫚': 5,
  '🥕': 5, '🧅': 1, '🌽': 5, '🥦': 5, '🥒': 5, '🥬': 5, '🫛': 5, '🫑': 5, '🥑': 5, '🍠': 5, '🍆': 5,
  '🧄': 5, '🥔': 5, '🍄‍': -5, '🫘': -5, '🌰': 5, '🥜': 5, '🍞': 5, '🫓': 5, '🥐': 5, '🥖': 5, '🥯': 5,
  '🧇': 5, '🥞': 5, '🍳': 5, '🥚': 5, '🧀': 5, '🥓': 5, '🥩': 4, '🍗': 5, '🍖': 5, '🍔': 5, '🌭': 5,
  '🥪': 5, '🥨': 5, '🍟': 5, '🍕': 5, '🫔': 5, '🌮': 5, '🌯': 5, '🥙': 5, '🧆': 5, '🥘': 5, '🍝': 5,
  '🥫': 2, '🫕': 5, '🥗': 5, '🥣': 15, '🍲': 5, '🍛': 5, '🍜': 35, '🦪': 5, '🦞': 5, '🍣': 5, '🍤': 5,
  '🥠': 5, '🍚': 5, '🍱': 5, '🥟': 5, '🥡': 5, '🍢': 5, '🍙': 5, '🍘': 5, '🍥': 5, '🍡': 5, '🥮': 5,
  '🍧': 5, '🍨': 5, '🍦': 5, '🥧': 5, '🍰': 5, '🍮': 5, '🎂': 5, '🧁': 5, '🍭': 5, '🍫': 5, '🍫': 5,
  '🍩': 5, '🍪': 5, '🍯': 5, '🧂': 5, '🧈': 5, '🍿': 5, '🧊': 5, '🫙': 5, '🥤': 5, '🧋': 5, '🧃': 5,
  '🥛': 5, '🍼': 5, '🥃': 5, '☕': 5, '🫗': 5, '🫖': 5, '🍵': 5, '🍸': 5, '🍹': 5, '🧉': 5, '🍺': 5,
  '🍶': 5, '🍷': 5, '🍾': 5, '🥂': 5, '🍻': 5, '🥃': 5,
};

// Set of emojis for medicine
const medicineEmojis = new Set(['🩹', '💊', '💉']);

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
      // If pet data doesn't exist, create an empty object
      if (error.code === 'ENOENT') {
        petData = {};
      } else {
        console.error('Error reading pet data:', error);
        sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
        return;
      }
    }

    // Check if the sender has an existing pet
    if (!petData[senderId] && action !== 'new') {
      sendMessage(senderId, { text: 'You don\'t have a pet. Create one using the command "pet new".' }, pageAccessToken);
      return;
    }

// Perform action based on user input
let petResponse;
switch (action) {
  case 'new':
    const petName = args.slice(1).join(' ');
    if (petName) {
      if (petData[senderId]) {
        petResponse = 'You already have a pet. Please delete it first before creating a new one.';
      } else {
        petData[senderId] = {
          name: petName,
          hunger: 100,
          happiness: 100,
          energy: 100
        };
        petResponse = `You have a new pet named ${petName}!`;
        fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 2));
      }
    } else {
      petResponse = 'Please provide a name for your new pet.';
    }
    break;
  case 'feed':
    const foodEmoji = args[1];
    if (!foodEmoji || !emojiHungerMap.hasOwnProperty(foodEmoji)) {
      petResponse = 'Please provide a valid food emoji to feed your pet.';
      break;
    }
    const hungerValue = emojiHungerMap[foodEmoji];
    petData[senderId].hunger = Math.min(100, petData[senderId].hunger + hungerValue);
    petResponse = `You feed your virtual pet ${foodEmoji} 🍽️`;
    break;
  case 'play':
    petData[senderId].happiness += 10;
    petResponse = 'You play with your virtual pet 🎾';
    break;
  case 'sleep':
    petData[senderId].energy += 10;
    petResponse = 'Your virtual pet goes to sleep 💤';
    break;
  case 'status':
    const pet = petData[senderId];
    const hungerBar = generateBar('Hunger', pet.hunger);
    const happinessBar = generateBar('Happiness', pet.happiness);
    const energyBar = generateBar('Energy', pet.energy);
    petResponse = `${pet.name} Status:\n${hungerBar}\n${happinessBar}\n${energyBar}`;
    break;
  case 'rename':
    const newName = args.slice(1).join(' ');
    if (newName) {
      petData[senderId].name = newName;
      petResponse = `Your virtual pet is now named ${newName}!`;
      fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 2));
    } else {
      petResponse = 'Please provide a name to rename your pet.';
    }
    break;
  case 'delete':
    delete petData[senderId];
    fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 2));
    petResponse = 'Your virtual pet has been deleted.';
    break;
  case 'call':
    const calledName = args.slice(1).join(' ');
    if (calledName === petData[senderId].name) {
      petResponse = 'Your virtual pet responds happily!';
    } else {
      petResponse = 'There is no pet with that name.';
    }
    break;
  case 'help':
    const helpCommand = args[1];
    if (helpCommand) {
      petResponse = getHelpText(helpCommand);
    } else {
      petResponse = 'Available actions: new, feed, play, sleep, status, rename, delete, call, help.';
    }
    break;
  default:
    petResponse = 'That action is not recognized. Type "pet help" for available actions.';
}

// Check if hunger is low and send message to owner
if (petData[senderId].hunger <= lowHungerThreshold) {
  sendMessage(senderId, { text: `Your virtual pet ${petData[senderId].name} is getting hungry!` }, pageAccessToken);
}

// Check if energy is low and send message to owner
if (petData[senderId].energy <= lowEnergyThreshold) {
  sendMessage(senderId, { text: `Your virtual pet ${petData[senderId].name} is getting tired!` }, pageAccessToken);
}

// Check if the pet gets sick and dies due to low hunger or energy
if (petData[senderId].hunger === 0 || petData[senderId].energy === 0) {
  clearInterval(timer);
  sendMessage(senderId, { text: `Your pet ${petData[senderId].name} got sick and died because its hunger or energy level was too low!` }, pageAccessToken);
  return;
}

// Start the timer if it's not already running
if (!timer) {
  startTimer(petData[senderId], sendMessage, senderId, pageAccessToken);
}

// Send the pet's response
sendMessage(senderId, { text: petResponse }, pageAccessToken);