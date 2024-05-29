// Example help command handler
function handleHelpCommand(senderId, sendMessage) {
  const helpMessage = "Here are some commands you can use:\n- hi\n- hello\n- help\n- how are you\n- what's up\n- gemini";
  sendMessage(senderId, { text: helpMessage });
}

module.exports = {
  handleHelpCommand
};