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
	get(key: string): Promise<roomValue | undefined>;
	put(key: string, value: roomValue): Promise<void>;
	delete(key: string): Promise<boolean>;
}

async function createRoomStub(): Promise<RoomStub> {
	const data = new Map<string, roomValue>();
	const storage: DurableObjectStorage = {
		get: async (key: string) => data.get(key),
		put: async (key: string, value: roomValue) => {
			data.set(key, value);
		},
		delete: async (key: string) => data.delete(key),
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
