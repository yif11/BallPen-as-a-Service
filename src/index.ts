import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

type Bindings = {
	PEN: DurableObjectNamespace;
	ASSETS: { fetch: (request: Request) => Promise<Response> };
};

const app = new Hono<{ Bindings: Bindings }>();

export class PenDO extends DurableObject {
	async fetch(request: Request) {
		const url = new URL(request.url);

		if (url.pathname.endsWith("/state")) {
			const penTipOut = (await this.ctx.storage.get("penTipOut")) === true;
			const pressCount =
				(await this.ctx.storage.get<number>("pressCount")) || 0;
			return Response.json({ penTipOut, pressCount });
		}

		if (url.pathname.endsWith("/press")) {
			return Response.json({ ok: true, event: "press" });
		}

		if (url.pathname.endsWith("/release")) {
			let penTipOut = (await this.ctx.storage.get("penTipOut")) === true;
			let pressCount = (await this.ctx.storage.get<number>("pressCount")) || 0;

			penTipOut = !penTipOut;
			pressCount += 1;

			this.ctx.storage.put("penTipOut", penTipOut);
			this.ctx.storage.put("pressCount", pressCount);

			return Response.json({
				ok: true,
				event: "release",
				penTipOut,
				pressCount,
			});
		}

		return new Response("Not found", { status: 404 });
	}
}

// CORS middleware
app.use("*", async (c, next) => {
	if (c.req.method === "OPTIONS") {
		const headers = new Headers();
		headers.set("Access-Control-Allow-Origin", "*");
		headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
		headers.set("Access-Control-Allow-Headers", "Content-Type");
		return new Response(null, { status: 204, headers });
	}
	await next();
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	c.header("Access-Control-Allow-Headers", "Content-Type");
});

app.all("/state", async (c) => {
	const id = c.env.PEN.idFromName("GLOBAL_PEN");
	const stub = c.env.PEN.get(id);
	return stub.fetch(c.req.raw);
});

app.all("/press", async (c) => {
	const id = c.env.PEN.idFromName("GLOBAL_PEN");
	const stub = c.env.PEN.get(id);
	return stub.fetch(c.req.raw);
});

app.all("/release", async (c) => {
	const id = c.env.PEN.idFromName("GLOBAL_PEN");
	const stub = c.env.PEN.get(id);
	return stub.fetch(c.req.raw);
});

app.get("/*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
