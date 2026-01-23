import { DurableObject } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	type durableObjectError,
	roomKeyParamSchema,
	roomValueSchema,
} from "./Room.types";

type RoomState = DurableObject<Env>["ctx"];
export type RoomStub = DurableObjectStub<Room>;

export class Room extends DurableObject<Env> {
	private readonly app: Hono;

	constructor(ctx: RoomState, env: Env) {
		super(ctx, env);

		this.app = new Hono()
			.get(
				"/room/:key",
				zValidator("param", roomKeyParamSchema, (result, c) => {
					if (!result.success)
						return c.json({ ok: false, error: "bad-request" }, 400);
				}),
				async (c) => {
					const data = await this.ctx.storage.get(c.req.valid("param").key);
					if (data === undefined)
						return c.json({ ok: false, error: "unavailable" }, 404);

					const validated = roomValueSchema.safeParse(data);
					if (!validated.success)
						return c.json({ ok: false, error: "internal-server-error" }, 500);

					return c.json({ ok: true, value: validated.data }, 200);
				},
			)

			.put(
				"/room/:key",
				zValidator("param", roomKeyParamSchema, (result, c) => {
					if (!result.success)
						return c.json({ ok: false, error: "bad-request" }, 400);
				}),
				zValidator("json", roomValueSchema, (result, c) => {
					if (!result.success)
						return c.json({ ok: false, error: "bad-request" }, 400);
				}),
				async (c) => {
					const params = c.req.valid("param");
					const value = c.req.valid("json");
					await this.ctx.storage.put(params.key, value);
					return c.json({ ok: true }, 200);
				},
			)

			.delete(
				"/room/:key",
				zValidator("param", roomKeyParamSchema, (result, c) => {
					if (!result.success)
						return c.json({ ok: false, error: "bad-request" }, 400);
				}),
				async (c) => {
					if (await this.ctx.storage.delete(c.req.valid("param").key))
						return c.json({ ok: true }, 200);
					return c.json({ ok: false, error: "unavailable" }, 404);
				},
			);
	}

	fetch(request: Request): Promise<Response> {
		return Promise.resolve(this.app.fetch(request));
	}
}

export type RoomResponse<T = undefined> =
	| { ok: true; value?: T }
	| { ok: false; error: durableObjectError };
