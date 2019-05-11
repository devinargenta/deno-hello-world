import { ServerRequest } from 'https://deno.land/std@v0.3.2/http/server.ts';

import pathToRegExp from './vendor/pathToRegEx.js';
const { readFile, cwd } = Deno;

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

export interface Context {
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

export const router = new Router();

export async function useRouter(req: ServerRequest) {
  const path = req.url.split('?')[0];
  const url = new URL(req.url, '/');
  const query = url.searchParams;
  const context: Context = {
    request: req,
    params: {},
    query: query
  };
  for (let { name, callRoute } of router[req.method]) {
    let tokens = [];
    const routeRegex = pathToRegExp(name, tokens);
    const matched = routeRegex.exec(path);
    if (matched) {
      for (let token in tokens) {
        const paramName = tokens[token].name;
        const idx = Number(token) + 1;
        const paramValue = matched[idx];
        context.params[paramName] = paramValue;
      }
      return await callRoute(context);
    }
  }
  // no routes match
  return sendStatus(req, 404, 'Yikes!!!!!!!!!!!');
}

function sendStatus(
  req: ServerRequest,
  status: number,
  message: string = null
): Promise<void> {
  return req.respond({ status, body: new TextEncoder().encode(message) });
}

export async function useStatic(req: ServerRequest, pathname: string) {
  if (req.method !== 'GET') return sendStatus(req, 401, 'no');
  try {
    const path = req.url.split('?')[0];
    if (!path.includes(pathname)) return;
    const dir = cwd();
    const file = await readFile(dir + path);
    return req.respond({ body: file });
  } catch (error) {
    return sendStatus(req, 404, 'Resource Not Found');
  }
}
