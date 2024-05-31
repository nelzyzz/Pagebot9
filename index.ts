import { serve } from 'https://deno.land/std/http/server.ts';
import { readFileSync } from 'https://deno.land/std/fs/mod.ts';
import { handleMessage } from './handles/handleMessage.ts';
import { handlePostback } from './handles/handlePostback.ts';

const server = serve({ port: 3000 });
const VERIFY_TOKEN = 'pagebot';

const PAGE_ACCESS_TOKEN = readFileSync('token.txt');

console.log(`Server is running on port 3000`);

for await (const req of server) {
    if (req.method === 'GET' && req.url === '/webhook') {
        const params = new URLSearchParams(req.url.split('?')[1] || '');
        const mode = params.get('hub.mode');
        const token = params.get('hub.verify_token');
        const challenge = params.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            req.respond({ status: 200, body: challenge });
        } else {
            req.respond({ status: 403, body: 'Forbidden' });
        }
    } else if (req.method === 'POST' && req.url === '/webhook') {
        const body = await Deno.readAll(req.body);
        const bodyString = new TextDecoder().decode(body);
        const data = JSON.parse(bodyString);

        if (data.object === 'page') {
            for (const entry of data.entry) {
                for (const event of entry.messaging) {
                    if (event.message) {
                        handleMessage(event, PAGE_ACCESS_TOKEN);
                    } else if (event.postback) {
                        handlePostback(event, PAGE_ACCESS_TOKEN);
                    }
                }
            }
            req.respond({ status: 200, body: 'EVENT_RECEIVED' });
        } else {
            req.respond({ status: 404, body: 'Not Found' });
        }
    } else {
        req.respond({ status: 404, body: 'Not Found' });
    }
}