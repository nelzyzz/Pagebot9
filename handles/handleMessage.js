const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

const helpCommand = {
  name: 'help',
  description: 'Show available commands',
  author: 'System', // Author for the help command
  execute(senderId, args, pageAccessToken, sendMessage) {
    const helpMessage = `Here are the available commands:\n\n${[...commands.values()].map(cmd => `${cmd.name} - ${cmd.description} - ${cmd.author}`).join('\n')}`;
    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};

commands.set(helpCommand.name, helpCommand);

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.toLowerCase();

  const args = messageText.split(' ');
  const commandName = args.shift();

  if (commands.has(commandName)) {
    const command = commands.get(commandName);
    await command.execute(senderId, args, pageAccessToken, sendMessage);
  }
}

module.exports = { handleMessage };