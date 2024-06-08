const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

// Serve static files from the Music directory
app.use(express.static(path.join(__dirname, 'Music')));

// Endpoint for Facebook webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Endpoint for handling messages and postbacks
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                if (event.message) {
                    handleMessage(event, PAGE_ACCESS_TOKEN);
                } else if (event.postback) {
                    handlePostback(event, PAGE_ACCESS_TOKEN);
                }
            });
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Function to log the current date and time in PH time
function logTime() {
    const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true  // Use 12-hour format with AM/PM
    };

    const currentTime = new Date().toLocaleString('en-PH', options);
    const logMessage = `Current time (PH): ${currentTime}\n`;
    console.log(logMessage);

    // Append the log message to a file
    fs.appendFile('timeLog.txt', logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file', err);
        }
    });
}

// Log the time immediately
logTime();

// Set interval to call logTime every 30 minutes (1800000 milliseconds)
setInterval(logTime, 3 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});