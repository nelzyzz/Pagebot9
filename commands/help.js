const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'help',
  description: 'Show available commands',
  author: 'System',
  execute(senderId, args, pageAccessToken, sendMessage) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `⤜${command.name}⤛\n  - ${command.description}\n  - Credits: ${command.author}`;
    });

    const totalCommands = commandFiles.length;
    const commandsPerPage = 7;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);
    const currentPage = parseInt(args[0], 10) || 1;

    // Ensure currentPage is within valid range
    const page = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = (page - 1) * commandsPerPage;
    const endIndex = Math.min(startIndex + commandsPerPage, totalCommands);

    const paginatedCommands = commands.slice(startIndex, endIndex);
    const helpMessage = `Here are the available commands (Page ${page}/${totalPages}):\nTotal commands: ${totalCommands}\n\n${paginatedCommands.join('\n\n')}`;

    // Define navigation buttons
    const buttons = [];
    if (page > 1) {
      buttons.push({
        type: 'postback',
        title: `Previous (${page - 1})`,
        payload: `help ${page - 1}`
      });
    }
    if (page < totalPages) {
      buttons.push({
        type: 'postback',
        title: `Next (${page + 1})`,
        payload: `help ${page + 1}`
      });
    }

    const messageData = {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: helpMessage + "\n\nUse the buttons below to navigate pages.",
            buttons: buttons
          }
        }
      }
    };

    sendMessage(senderId, messageData, pageAccessToken);
  }
};