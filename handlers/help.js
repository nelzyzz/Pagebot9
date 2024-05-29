const { triggers } = require('./commands');

function handleHelpCommand(senderId) {
  const helpMessage = "Here are all available commands:\n" + triggers.join("\n- ");
  sendMessage(senderId, { text: helpMessage });
}

module.exports = {
  handleHelpCommand
};