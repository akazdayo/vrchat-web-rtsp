import { err, ok, type Result } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { durableObjectError, room } from "@/durable-objects/Room.types";
import type { TurnstileResponse } from "@/utils/types/turnstile";

const validateTurnstileMock = vi.fn();
const getRequestHeaderMock = vi.fn<(name: string) => string | undefined>();
const createMock =
	vi.fn<(data: room) => Promise<Result<void, durableObjectError>>>();
const idFromNameMock = vi.fn((name: string) => `${name}-id`);
const getRoomMock = vi.fn((_id: string) => ({}));

vi.mock("cloudflare:workers", () => ({
	env: {
		ROOM: {
			idFromName: idFromNameMock,
			get: getRoomMock,
		},
	},
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		inputValidator: (_validator: unknown) => ({
			handler: (
				handler: (input: { data: { token: string } }) => Promise<unknown>,
			) => handler,
		}),
	}),
}));

vi.mock("@tanstack/react-start/server", () => ({
	getRequestHeader: getRequestHeaderMock,
}));

vi.mock("@/utils/turnstile.server", () => ({
	validateTurnstile: validateTurnstileMock,
}));

vi.mock("@/durable-objects/wrapper", () => ({
	RoomStore: class {
		create = createMock;
	},
}));

const { verifySession } = await import("@/utils/newSession.functions");

const turnstileSuccess: TurnstileResponse = {
	success: true,
	challenge_ts: "2024-01-01T00:00:00Z",
	hostname: "example.com",
};

beforeEach(() => {
	validateTurnstileMock.mockReset();
	getRequestHeaderMock.mockReset();
	createMock.mockReset();
	idFromNameMock.mockClear();
	getRoomMock.mockClear();
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("verifySession", () => {
	it("returns turnstile error when challenge fails", async () => {
		getRequestHeaderMock.mockReturnValue(undefined);
		validateTurnstileMock.mockResolvedValue(err("timeout-or-duplicate"));

		const result = await verifySession({ data: { token: "token" } });

		expect(result).toEqual({
			success: false,
			error: "timeout-or-duplicate",
		});
		expect(createMock).not.toHaveBeenCalled();
	});

	it("prioritizes CF-Connecting-IP and creates a room code", async () => {
		getRequestHeaderMock.mockImplementation((name: string) => {
			if (name === "CF-Connecting-IP") {
				return "198.51.100.42";
			}
			if (name === "X-Forwarded-For") {
				return "203.0.113.10";
			}
			return undefined;
		});
		validateTurnstileMock.mockResolvedValue(ok(turnstileSuccess));
		createMock.mockResolvedValue(ok(undefined));
		vi.spyOn(Math, "random").mockReturnValue(0);

		const result = await verifySession({ data: { token: "token" } });

		expect(result).toEqual({
			success: true,
			code: "AAAA",
		});
		expect(validateTurnstileMock).toHaveBeenCalledWith(
			"token",
			"198.51.100.42",
		);
		expect(idFromNameMock).toHaveBeenCalledWith("room");
		expect(getRoomMock).toHaveBeenCalledWith("room-id");
		expect(createMock).toHaveBeenCalledWith({
			key: "AAAA",
			value: {
				createdAt: "2026-01-02T03:04:05.000Z",
			},
		});
	});

	it("falls back to X-Forwarded-For when CF-Connecting-IP is missing", async () => {
		getRequestHeaderMock.mockImplementation((name: string) => {
			if (name === "CF-Connecting-IP") {
				return undefined;
			}
			if (name === "X-Forwarded-For") {
				return "203.0.113.20";
			}
			return undefined;
		});
		validateTurnstileMock.mockResolvedValue(ok(turnstileSuccess));
		createMock.mockResolvedValue(ok(undefined));
		vi.spyOn(Math, "random").mockReturnValue(0);

		await verifySession({ data: { token: "token" } });

		expect(validateTurnstileMock).toHaveBeenCalledWith("token", "203.0.113.20");
	});

	it("returns room creation errors", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		getRequestHeaderMock.mockReturnValue(undefined);
		validateTurnstileMock.mockResolvedValue(ok(turnstileSuccess));
		createMock.mockResolvedValue(err("unavailable"));
		vi.spyOn(Math, "random").mockReturnValue(0);

		const result = await verifySession({ data: { token: "token" } });

		expect(result).toEqual({
			success: false,
			error: "unavailable",
		});
		expect(consoleErrorSpy).toHaveBeenCalledWith("unavailable");
	});
});
