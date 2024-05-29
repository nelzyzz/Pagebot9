const { triggers } = require('./commands'); // Assuming triggers are defined in commands.js

function handleHelpCommand(senderId, sendMessage) {
  const helpMessage = "Here are all available commands:\n" + triggers.join("\n- ");
  sendMessage(senderId, { text: helpMessage });
}

module.exports = {
  handleHelpCommand
};