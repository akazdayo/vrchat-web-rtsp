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
	const parsed = mediamtxAuthSchema.safeParse(payload);

	if (!parsed.success) {
		return c.json({ ok: false }, 400);
	}

	if (parsed.data.action === "read") {
		return c.json({ ok: true });
	}

	if (parsed.data.action !== "publish") {
		return c.json({ ok: false }, 401);
	}

	const pathParsed = roomKeySchema.safeParse(parsed.data.path ?? "");
	if (!pathParsed.success) {
		return c.json({ ok: false }, 401);
	}

	const roomStore = new RoomStore(getRoomStub());
	const existing = await roomStore.get(pathParsed.data);
	if (existing.isErr()) {
		return respondRoomError(c, existing.error);
	}

	const removed = await roomStore.remove(pathParsed.data);
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
