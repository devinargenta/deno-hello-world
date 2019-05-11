import { serve } from 'https://deno.land/std@v0.3.2/http/server.ts';
import { router, useRouter, useStatic, Context } from './router.ts';
const encodeText = (text: string): Uint8Array => new TextEncoder().encode(text);

router.get('/hello', (c: Context) => {
  const { request: req, query } = c;
  const name = query.get('name') || 'world';

  const body = encodeText(`
  <html>
    <head>
      <script src="/static/main.js"></script>
      <link  rel="stylesheet" href="/static/main.css">
    </head>
    <body>
      <h1>Hello, ${name}</h1>
      <img width="120" src="/static/fff.jpeg" />
      <img width="120" src="/static/1234.jpeg" />
    </body>
  </html>
  `);
  req.respond({ body });
});

router.get('/api/:id(\\d+)', (c: Context) => {
  const { request, params } = c;
  request.respond({
    body: encodeText(`API Route, id: ${params.id}`)
  });
});

router.get('/user/:username/:thing', (c: Context) => {
  const { request, params } = c;
  request.respond({
    body: encodeText(`Username:, ${params.username} thing: ${params.thing}`)
  });
});

async function main() {
  for await (const req of serve(':8000')) {
    await useStatic(req, '/static/');
    await useRouter(req);
  }
}

main();
