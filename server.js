const http = require('http');
const Koa = require('koa');
const app = new Koa();

class SetDayNow {
  constructor(date) {
    this.month = date.getMonth() + 1;
    this.day = date.getDate();
    this.year = String(date.getFullYear()).slice(2);
    this.hours = date.getHours();
    this.min = date.getMinutes();
    this.sec = date.getSeconds();
  }

  create() {
    const dateTime = `${this.check(this.day)}.${this.check(this.month)}.${this.year}`;
    const time = `${this.check(this.hours)}:${this.check(this.min)}:${this.check(this.sec)}`;
    return this.final(dateTime, time);
  }

  check(elem) {
    if (elem < 10) {
      return `0${elem}`;
    }
    return elem;
  }

  final(dateTime, time) {
    return `${dateTime}  ${time}`;
  }
}

const dataInfoArr = [];

function MakeOnline(act) {
  dataInfoArr.push([act, new SetDayNow(new Date()).create()]);
  return dataInfoArr;
}

// генерируем событие
function eventOnline() {
  const chance = (Math.random() * 100);

  if (chance >= 0 && chance <= 10) { // 10%
    return 'goal';
  } else if (chance > 10 && chance <= 50) { // 40%
    return 'freekick';
  } else { // 50%
    return 'action';
  }
}
// генерируем событие

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
let eventCount = 0;

router.get('/sse', async (ctx) => {
  streamEvents(ctx.req, ctx.res, {
    async fetch() {
      return [];
    },
    stream(sse) {
      let timerId = setInterval(() => {
        const onlineEvent = eventOnline(); // чтобы события не сбивались и показывались одинаково
        sse.sendEvent({
          data: (MakeOnline(onlineEvent)).toString(), // время публикации поста
          event: onlineEvent, // не забыть поменять на onlineEvent
          id: uuid.v4(),
        });
        if (eventCount < 50) {
          eventCount += 1;
        } else {
          clearTimeout(timerId); // останавливаем трансляцию
        }
      }, 500);
    }
  });

  ctx.respond = false; // koa не будет обрабатывать ответ
});

router.get('/index', async (ctx) => {
  ctx.response.body = 'hello';
})

app.use(router.routes()).use(router.allowedMethods());

// const port = 7075;
// const server = http.createServer(app.callback()).listen(port)
// server.listen(port);

// const port = 7075;
// http.createServer(app.callback()).listen(port);

app.use(router.routes()).use(router.allowedMethods());
http.createServer(app.callback()).listen(process.env.PORT || 7075);