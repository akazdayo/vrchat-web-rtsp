import { err, ok, type Result } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	durableObjectError,
	roomValue,
} from "@/durable-objects/Room.types";

type GetMock = (key: string) => Promise<Result<roomValue, durableObjectError>>;
const getMock = vi.fn<GetMock>();

type RemoveMock = (key: string) => Promise<Result<void, durableObjectError>>;
const removeMock = vi.fn<RemoveMock>();

vi.mock("cloudflare:workers", () => ({
	env: {
		ROOM: {
			idFromName: vi.fn(() => "room-id"),
			get: vi.fn(() => ({})),
		},
	},
}));

vi.mock("@/durable-objects/wrapper", () => ({
	RoomStore: class {
		constructor(_stub: unknown) {}
		get = getMock;
		remove = removeMock;
	},
}));

interface ApiResponse {
	ok: boolean;
}

const createJsonRequest = (payload: unknown): Request =>
	new Request("http://example.com/api/mediamtx/auth", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

const createInvalidJsonRequest = (): Request =>
	new Request("http://example.com/api/mediamtx/auth", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: "{invalid",
	});

const sendRequest = async (
	request: Request,
): Promise<{ response: Response; body: ApiResponse }> => {
	const { Route } = await import("@/routes/api.$");
	type RouteHandlers = {
		POST: (args: { request: Request }) => Promise<Response>;
	};

	type RouteServer = {
		handlers: RouteHandlers;
	};

	type ServerRoute = {
		server?: RouteServer;
		options?: {
			server?: RouteServer;
		};
	};

	const route = Route as unknown as ServerRoute;
	const handler =
		route.server?.handlers.POST ?? route.options?.server?.handlers.POST;
	if (!handler) {
		throw new Error("POST handler not found");
	}
	const response = await handler({ request });
	const body = (await response.json()) as ApiResponse;
	return { response, body };
};

const publishPayload = (path: string): { action: string; path: string } => ({
	action: "publish",
	path,
});

beforeEach(() => {
	getMock.mockReset();
	removeMock.mockReset();
	vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("POST /api/mediamtx/auth", () => {
	it("returns 400 when payload is invalid", async () => {
		const { response, body } = await sendRequest(createInvalidJsonRequest());

		expect(response.status).toBe(400);
		expect(body).toEqual({ ok: false });
	});

	it("returns ok for read action", async () => {
		const { response, body } = await sendRequest(
			createJsonRequest({ action: "read" }),
		);

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true });
	});

	it("returns 401 for unknown action", async () => {
		const { response, body } = await sendRequest(
			createJsonRequest({ action: "write" }),
		);

		expect(response.status).toBe(401);
		expect(body).toEqual({ ok: false });
	});

	it("returns 401 for invalid room key", async () => {
		const { response, body } = await sendRequest(
			createJsonRequest(publishPayload("ABCDE")),
		);

		expect(response.status).toBe(401);
		expect(body).toEqual({ ok: false });
	});

	it("propagates room store get errors", async () => {
		getMock.mockResolvedValue(err("unavailable"));

		const { response, body } = await sendRequest(
			createJsonRequest(publishPayload("ABCD")),
		);

		expect(getMock).toHaveBeenCalledWith("ABCD");
		expect(removeMock).not.toHaveBeenCalled();
		expect(response.status).toBe(401);
		expect(body).toEqual({ ok: false });
	});

	it("propagates room store remove errors", async () => {
		getMock.mockResolvedValue(ok({ createdAt: "2024-01-01T00:00:00Z" }));
		removeMock.mockResolvedValue(err("internal-server-error"));

		const { response, body } = await sendRequest(
			createJsonRequest(publishPayload("ABCD")),
		);

		expect(removeMock).toHaveBeenCalledWith("ABCD");
		expect(response.status).toBe(500);
		expect(body).toEqual({ ok: false });
	});

	it("returns ok when removal succeeds", async () => {
		getMock.mockResolvedValue(ok({ createdAt: "2024-01-01T00:00:00Z" }));
		removeMock.mockResolvedValue(ok());

		const { response, body } = await sendRequest(
			createJsonRequest(publishPayload("ABCD")),
		);

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true });
	});
});
