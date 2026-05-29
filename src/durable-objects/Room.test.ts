import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
	class DurableObject {
		ctx: unknown;
		env: Env;

		constructor(ctx: unknown, env: Env) {
			this.ctx = ctx;
			this.env = env;
		}
	}

	return { DurableObject };
});

type SqlRow = Record<string, unknown>;

interface DurableObjectStorage {
	sql: {
		exec<T extends SqlRow>(
			query: string,
			...bindings: unknown[]
		): {
			toArray(): T[];
			rowsWritten: number;
		};
	};
}

const parseJson = async <T>(response: Response): Promise<T> => {
	return (await response.json()) as T;
};

const createRoomHarness = async (
	initialRows: Record<string, string> = {},
): Promise<{
	request: (
		method: "GET" | "PUT" | "DELETE",
		path: string,
		body?: unknown,
	) => Promise<Response>;
}> => {
	const rows = new Map<string, string>(Object.entries(initialRows));

	const storage: DurableObjectStorage = {
		sql: {
			exec: <T extends SqlRow>(query: string, ...bindings: unknown[]) => {
				if (query.startsWith("CREATE TABLE")) {
					return { toArray: () => [] as T[], rowsWritten: 0 };
				}

				if (query.startsWith("INSERT OR REPLACE")) {
					const [key, createdAt] = bindings as [string, string];
					rows.set(key, createdAt);
					return { toArray: () => [] as T[], rowsWritten: 1 };
				}

				if (query.startsWith("SELECT")) {
					const [key] = bindings as [string];
					const createdAt = rows.get(key);
					if (!createdAt) {
						return { toArray: () => [] as T[], rowsWritten: 0 };
					}

					return {
						toArray: () => [{ created_at: createdAt }] as unknown as T[],
						rowsWritten: 0,
					};
				}

				if (query.startsWith("DELETE")) {
					const [key] = bindings as [string];
					const deleted = rows.delete(key);
					return { toArray: () => [] as T[], rowsWritten: deleted ? 1 : 0 };
				}

				return { toArray: () => [] as T[], rowsWritten: 0 };
			},
		},
	};

	const ctx = { storage };
	const env = {} as Env;
	const { Room } = await import("@/durable-objects/Room");
	const room = new Room(
		ctx as ConstructorParameters<typeof Room>[0],
		env as ConstructorParameters<typeof Room>[1],
	);

	const request = async (
		method: "GET" | "PUT" | "DELETE",
		path: string,
		body?: unknown,
	): Promise<Response> => {
		const init: RequestInit = { method };
		if (body !== undefined) {
			init.headers = { "Content-Type": "application/json" };
			init.body = JSON.stringify(body);
		}

		return await room.fetch(new Request(`http://room${path}`, init));
	};

	return { request };
};

describe("Room durable object", () => {
	it("supports room create/get/delete lifecycle", async () => {
		const { request } = await createRoomHarness();
		const createdAt = "2026-01-01T00:00:00.000Z";

		const putResponse = await request("PUT", "/room/ABCD", { createdAt });
		expect(putResponse.status).toBe(200);
		expect(await parseJson<{ ok: boolean }>(putResponse)).toEqual({ ok: true });

		const getResponse = await request("GET", "/room/ABCD");
		expect(getResponse.status).toBe(200);
		expect(
			await parseJson<{ ok: boolean; value?: { createdAt: string } }>(
				getResponse,
			),
		).toEqual({
			ok: true,
			value: { createdAt },
		});

		const deleteResponse = await request("DELETE", "/room/ABCD");
		expect(deleteResponse.status).toBe(200);
		expect(await parseJson<{ ok: boolean }>(deleteResponse)).toEqual({
			ok: true,
		});
	});

	it("returns bad-request for invalid room keys", async () => {
		const { request } = await createRoomHarness();

		const getResponse = await request("GET", "/room/ABCDE");
		expect(getResponse.status).toBe(400);
		expect(
			await parseJson<{ ok: boolean; error?: string }>(getResponse),
		).toEqual({
			ok: false,
			error: "bad-request",
		});

		const putResponse = await request("PUT", "/room/ABCDE", {
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(putResponse.status).toBe(400);
		expect(
			await parseJson<{ ok: boolean; error?: string }>(putResponse),
		).toEqual({
			ok: false,
			error: "bad-request",
		});

		const deleteResponse = await request("DELETE", "/room/ABCDE");
		expect(deleteResponse.status).toBe(400);
		expect(
			await parseJson<{ ok: boolean; error?: string }>(deleteResponse),
		).toEqual({
			ok: false,
			error: "bad-request",
		});
	});

	it("returns bad-request for invalid room payload", async () => {
		const { request } = await createRoomHarness();

		const response = await request("PUT", "/room/ABCD", {
			createdAt: "invalid-date",
		});

		expect(response.status).toBe(400);
		expect(await parseJson<{ ok: boolean; error?: string }>(response)).toEqual({
			ok: false,
			error: "bad-request",
		});
	});

	it("returns unavailable for missing rooms", async () => {
		const { request } = await createRoomHarness();

		const getResponse = await request("GET", "/room/ABCD");
		expect(getResponse.status).toBe(404);
		expect(
			await parseJson<{ ok: boolean; error?: string }>(getResponse),
		).toEqual({
			ok: false,
			error: "unavailable",
		});

		const deleteResponse = await request("DELETE", "/room/ABCD");
		expect(deleteResponse.status).toBe(404);
		expect(
			await parseJson<{ ok: boolean; error?: string }>(deleteResponse),
		).toEqual({
			ok: false,
			error: "unavailable",
		});
	});

	it("returns internal-server-error for invalid stored value", async () => {
		const { request } = await createRoomHarness({ ABCD: "not-an-iso-date" });

		const response = await request("GET", "/room/ABCD");

		expect(response.status).toBe(500);
		expect(await parseJson<{ ok: boolean; error?: string }>(response)).toEqual({
			ok: false,
			error: "internal-server-error",
		});
	});
});
