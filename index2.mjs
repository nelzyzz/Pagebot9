import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { handleMessage } from './handles/handleMessage.ts';
import { handlePostback } from './handles/handlePostback.ts';

const app = new Application();
const router = new Router();

app.use(router.routes());
app.use(router.allowedMethods());

const VERIFY_TOKEN = 'pagebot';

const tokenFile = await Deno.readTextFile('token.txt');
const PAGE_ACCESS_TOKEN = tokenFile.trim();

router.get('/webhook', (context) => {
  const params = context.request.url.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      context.response.body = challenge;
    } else {
      context.response.status = 403;
    }
  }
});

router.post('/webhook', async (context) => {
  const body = await context.request.body();
  const { object, entry } = body.value;

  if (object === 'page') {
    for (const entryItem of entry) {
      for (const event of entryItem.messaging) {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN);
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      }
    }

    context.response.body = 'EVENT_RECEIVED';
  } else {
    context.response.status = 404;
  }
});

const PORT = 3000;
console.log(`Server is running on port ${PORT}`);
await app.listen({ port: PORT });