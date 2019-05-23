const http = require('http');
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
    ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUD, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
  
    ctx.response.status = 204;
  }
});

const Router = require('koa-router');
const router = new Router();

const { streamEvents } = require('http-event-stream');
const uuid = require('uuid');

router.get('/sse', async (ctx) => {
  streamEvents(ctx.req, ctx.res, {
    stream(sse) {
      sse.sendEvent({
        data: new Date().toString(),
        event: 'date',
        id: uuid.v4(),
      });
    }
  });

  ctx.respond = false; // koa не будет обрабатывать ответ
});

router.get('/index', async (ctx) => {
  ctx.response.body = 'hello';
})

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7075;
const server = http.createServer(app.callback()).listen(port)
server.listen(port);