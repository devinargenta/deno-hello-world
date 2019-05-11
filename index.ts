import {
  serve,
  ServerRequest,
  Response
} from 'https://deno.land/std@v0.3.2/http/server.ts';
import pathToRegExp from './vendor/pathToRegEx.js';

interface Route {
  name: string;
  callRoute: Function;
}

interface IRouter {
  GET: Set<Route>;
  POST: Set<Route>;
  get: (name: string, callRoute: Function) => void;
  post: (name: string, callRoute: Function) => void;
}

interface Context {
  request: ServerRequest;
  params?: { [key: string]: any };
  query?: { [key: string]: any };
}

class Router implements IRouter {
  GET = new Set();
  POST = new Set();
  get(name: string, callRoute: Function) {
    this.GET.add({ name, callRoute });
  }
  post(name: string, callRoute: Function) {
    this.POST.add({ name, callRoute });
  }
}

const router = new Router();

router.get('/hello', (c: Context) => {
  const { request: req, query } = c;
  const name = query.get('name') || 'world';

  const body = new TextEncoder().encode(`
  <html>
    <body>
      <h1>Hello, ${name}</h1>
    </body>
  </html>
  `);
  return req.respond({ body });
});

router.get('/api/:id(\\d+)', (c: Context) => {
  const { request, params } = c;
  request.respond({
    body: new TextEncoder().encode(`API Route, id: ${params.id}`)
  });
});

router.get('/user/:username/:thing', (c: Context) => {
  const { request, params } = c;
  request.respond({
    body: new TextEncoder().encode(
      `Username:, ${params.username} thing: ${params.thing}`
    )
  });
});

async function main() {
  for await (const req of serve(':8000')) {
    const path = req.url.split('?')[0];
    const url = new URL(req.url, '/');
    const query = url.searchParams;
    for (let { name, callRoute } of router[req.method]) {
      let tokens = [];
      const routeRegex = pathToRegExp(name, tokens);
      const context: Context = {
        request: req,
        params: {},
      };
      const matched = routeRegex.exec(path);
      if (matched) {
        for (let token in tokens) {
          const paramName = tokens[token].name;
          const idx = Number(token) + 1;
          const paramValue = matched[idx];
          context.params[paramName] = paramValue;
        }
        context.query = query;
        await callRoute(context);
      }
    }
    req.respond({ status: 404, body: new TextEncoder().encode('Yikes!') });
  }
}

main();
