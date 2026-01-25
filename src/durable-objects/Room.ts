import { DurableObject } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	type durableObjectError,
	roomKeyParamSchema,
	type roomValue,
	roomValueSchema,
} from "./Room.types";

type RoomState = DurableObject<Env>["ctx"];
type SqlStorage = DurableObject<Env>["ctx"]["storage"]["sql"];
type SqlStorageValue = ArrayBuffer | string | number | null;
export type RoomStub = DurableObjectStub<Room>;

type RoomRow = Record<string, SqlStorageValue> & {
	created_at: string;
};

export class Room extends DurableObject<Env> {
	private readonly app: Hono;
	private readonly sql: SqlStorage;

	constructor(ctx: RoomState, env: Env) {
		super(ctx, env);

		this.sql = ctx.storage.sql;
		this.sql.exec(
			"CREATE TABLE IF NOT EXISTS rooms (key TEXT PRIMARY KEY, created_at TEXT NOT NULL)",
		);

		this.app = new Hono()
			.get(
				"/room/:key",
				zValidator("param", roomKeyParamSchema, (result, c) => {
					if (!result.success)
						return c.json({ ok: false, error: "bad-request" }, 400);
				}),
				async (c) => {
					const key = c.req.valid("param").key;
					const row = this.sql
						.exec<RoomRow>("SELECT created_at FROM rooms WHERE key = ?", key)
						.toArray()[0];

					if (!row) return c.json({ ok: false, error: "unavailable" }, 404);

					const candidate: roomValue = {
						createdAt: row.created_at,
					};
					const validated = roomValueSchema.safeParse(candidate);
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
					// TODO: 衝突チェックをする
					const params = c.req.valid("param");
					const value = c.req.valid("json");

					this.sql.exec(
						"INSERT OR REPLACE INTO rooms (key, created_at) VALUES (?, ?)",
						params.key,
						value.createdAt,
					);
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
					const key = c.req.valid("param").key;
					const result = this.sql.exec("DELETE FROM rooms WHERE key = ?", key);
					if (result.rowsWritten > 0) return c.json({ ok: true }, 200);
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
