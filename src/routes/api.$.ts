import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { RoomStub } from "@/durable-objects/Room";
import {
	type durableObjectError,
	roomKeySchema,
} from "@/durable-objects/Room.types";
import { RoomStore } from "@/durable-objects/wrapper";

const app = new Hono().basePath("/api");

const mediamtxAuthSchema = z.looseObject({
	// TODO: looseObjectやめたい
	action: z.string(),
	path: z.string().optional(),
});

function getRoomStub(): RoomStub {
	return env.ROOM.get(env.ROOM.idFromName("room")) as RoomStub;
}

function errorToStatus(error: durableObjectError): ContentfulStatusCode {
	switch (error) {
		case "bad-request":
			return 400;
		case "unavailable":
			return 401;
		case "internal-server-error":
			return 500;
	}
}

function respondRoomError(c: Context, error: durableObjectError): Response {
	return c.json({ ok: false }, errorToStatus(error));
}

app.post("/mediamtx/auth", async (c) => {
	const payload = await c.req.json().catch(() => null);
	console.log(payload);
	const parsed = mediamtxAuthSchema.safeParse(payload);
	console.log(parsed);

	if (!parsed.success) {
		console.log("error: 1");
		return c.json({ ok: false }, 400);
	}

	console.log("passed!");

	if (parsed.data.action === "read") {
		return c.json({ ok: true });
	}

	if (parsed.data.action !== "publish") {
		console.log("error: 2");
		return c.json({ ok: false }, 401);
	}

	console.log("passed!");

	const pathParsed = roomKeySchema.safeParse(parsed.data.path ?? "");
	console.log(pathParsed);
	if (!pathParsed.success) {
		console.log("error: 3");
		return c.json({ ok: false }, 401);
	}
	console.log("passed");

	const roomStore = new RoomStore(getRoomStub());
	console.log("stub created!");
	const existing = await roomStore.get(pathParsed.data);
	console.log(existing);
	if (existing.isErr()) {
		return respondRoomError(c, existing.error);
	}

	console.log("passed");

	const removed = await roomStore.remove(pathParsed.data);
	console.log(removed);
	if (removed.isErr()) {
		return respondRoomError(c, removed.error);
	}

	return c.json({ ok: true });
});

export const Route = createFileRoute("/api/$")({
	server: {
		handlers: {
			GET: ({ request }) => app.fetch(request),
			POST: ({ request }) => app.fetch(request),
			PUT: ({ request }) => app.fetch(request),
			DELETE: ({ request }) => app.fetch(request),
			PATCH: ({ request }) => app.fetch(request),
		},
	},
});
