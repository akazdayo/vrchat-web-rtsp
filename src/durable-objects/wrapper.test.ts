import { describe, expect, it, vi } from "vitest";
import type { RoomStub } from "@/durable-objects/Room";
import type { roomValue } from "@/durable-objects/Room.types";
import { RoomStore } from "@/durable-objects/wrapper";

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

interface DurableObjectStorage {
	sql: {
		exec(
			query: string,
			...bindings: unknown[]
		): {
			toArray(): Array<Record<string, unknown>>;
			rowsWritten: number;
		};
	};
}

async function createRoomStub(): Promise<RoomStub> {
	const data = new Map<string, roomValue>();
	const storage: DurableObjectStorage = {
		sql: {
			exec: (query: string, ...bindings: unknown[]) => {
				if (query.startsWith("CREATE TABLE"))
					return { toArray: () => [], rowsWritten: 0 };

				if (query.startsWith("INSERT OR REPLACE")) {
					const [key, createdAt] = bindings as [string, string];
					data.set(key, { createdAt });
					return { toArray: () => [], rowsWritten: 1 };
				}

				if (query.startsWith("SELECT")) {
					const [key] = bindings as [string];
					const value = data.get(key);
					return {
						toArray: () => (value ? [{ created_at: value.createdAt }] : []),
						rowsWritten: 0,
					};
				}

				if (query.startsWith("DELETE")) {
					const [key] = bindings as [string];
					const deleted = data.delete(key);
					return { toArray: () => [], rowsWritten: deleted ? 1 : 0 };
				}

				return { toArray: () => [], rowsWritten: 0 };
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

	const stub = {
		fetch: async (
			input: RequestInfo | URL,
			init?: RequestInit,
		): Promise<Response> => {
			const request =
				input instanceof Request ? input : new Request(input, init);
			return await room.fetch(request);
		},
	} as RoomStub;

	return stub;
}

describe("RoomStore", () => {
	it("create/get/remove が成功する", async () => {
		const stub = await createRoomStub();
		const store = new RoomStore(stub);
		const createdAt = new Date().toISOString();
		const key = "ABCD";

		const created = await store.create({
			key,
			value: { createdAt },
		});

		expect(created.isOk()).toBe(true);

		const fetched = await store.get(key);

		expect(fetched.isOk()).toBe(true);
		expect(fetched._unsafeUnwrap()).toEqual({ createdAt });

		const removed = await store.remove(key);

		expect(removed.isOk()).toBe(true);

		const removedFetched = await store.get(key);

		expect(removedFetched.isErr()).toBe(true);
		expect(removedFetched._unsafeUnwrapErr()).toBe("unavailable");
	});
});
