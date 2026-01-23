import { DurableObject } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { err, ok, type Result } from "neverthrow";
import {
	type durableObjectError,
	type room,
	type roomKey,
	roomKeyParamSchema,
	roomKeySchema,
	roomSchema,
	type roomValue,
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

type RoomResponse<T = undefined> =
	| { ok: true; value?: T }
	| { ok: false; error: durableObjectError };

export class RoomStore {
	constructor(private readonly stub: RoomStub) {}

	private createUrl(path: string): URL {
		return new URL(path, "http://room");
	}

	async get(key: string): Promise<Result<roomValue, durableObjectError>> {
		const parsed = roomKeySchema.safeParse(key);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			const response = await this.stub.fetch(
				this.createUrl(`/room/${parsed.data}`),
				{ method: "GET" },
			);
			const payload = (await response.json()) as RoomResponse<roomValue>;

			if (!payload.ok) {
				return err(payload.error);
			}
			if (payload.value === undefined) {
				return err("internal-server-error");
			}
			return ok(payload.value);
		} catch {
			return err("internal-server-error");
		}
	}

	async remove(
		key: roomKey,
	): Promise<Result<void, Exclude<durableObjectError, "unavailable">>> {
		const parsed = roomKeySchema.safeParse(key);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			const response = await this.stub.fetch(
				this.createUrl(`/room/${parsed.data}`),
				{ method: "DELETE" },
			);
			const payload = (await response.json()) as RoomResponse;

			if (!payload.ok) {
				return err(
					payload.error === "unavailable"
						? "internal-server-error"
						: payload.error,
				);
			}
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}

	async create(
		data: room,
	): Promise<Result<void, Exclude<durableObjectError, "unavailable">>> {
		const parsed = roomSchema.safeParse(data);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			const response = await this.stub.fetch(
				this.createUrl(`/room/${parsed.data.key}`),
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(parsed.data.value),
				},
			);
			const payload = (await response.json()) as RoomResponse;

			if (!payload.ok) {
				return err(
					payload.error === "unavailable"
						? "internal-server-error"
						: payload.error,
				);
			}
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}
}
