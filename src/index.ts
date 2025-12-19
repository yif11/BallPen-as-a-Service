import { Hono } from "hono";
import { logger } from "hono/logger";

type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

type Bindings = {
  PEN_STATE: KVNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};
const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());

// CORS middleware for local development
app.use('*', async (c, next) => {
  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return new Response(null, { status: 204, headers });
  }
  await next();
  // Ensure CORS header is present on all responses
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
});

async function getPenTipState(kv: KVNamespace) {
  return (await kv.get("penTipOut")) === "true";
}

async function setPenTipState(kv: KVNamespace, value: boolean) {
  await kv.put("penTipOut", value.toString());
}

async function incrementPressCount(kv: KVNamespace) {
  const v = await kv.get("pressCount");
  const n = Number(v || "0") + 1;
  await kv.put("pressCount", n.toString());
  return n;
}

// app.get("/", (c) => c.json({ message: "BallPen API running" }));

app.get("/state", async (c) => {
  const kv = c.env.PEN_STATE;
  const penTipOut = await getPenTipState(kv);
  const pressCount = Number((await kv.get("pressCount")) || "0");
  return c.json({ penTipOut, pressCount });
});

app.post("/press", (c) => {
  return c.json({ ok: true, event: "press" });
});

app.post("/release", async (c) => {
  const kv = c.env.PEN_STATE;
  const newState = !(await getPenTipState(kv));
  await setPenTipState(kv, newState);
  const count = await incrementPressCount(kv);

  return c.json({
    ok: true,
    event: "release",
    penTipOut: newState,
    pressCount: count,
  });
});

app.get("/*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
