import { afterEach, describe, expect, it, vi } from "vitest";

import type { TurnstileResponse } from "@/utils/types/turnstile";

vi.mock("cloudflare:workers", () => ({
	env: {
		TURNSTILE_SECRET_KEY: "test-secret",
	},
}));

const { validateTurnstile } = await import("@/utils/turnstile.server");

const TURNSTILE_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

type FetchMock = ReturnType<typeof vi.fn>;

const originalFetch = globalThis.fetch;

const createResponse = (data: unknown): Response =>
	new Response(JSON.stringify(data), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
		},
	});

const setFetchResponse = (data: unknown): FetchMock => {
	const fetchMock = vi.fn(async () => createResponse(data));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	return fetchMock;
};

const getFormData = (fetchMock: FetchMock): FormData => {
	const [url, options] = fetchMock.mock.calls[0] as [
		string,
		RequestInit | undefined,
	];

	expect(url).toBe(TURNSTILE_URL);
	expect(options?.method).toBe("POST");
	expect(options?.body).toBeInstanceOf(FormData);

	const body = options?.body;
	if (!(body instanceof FormData)) {
		throw new Error("Expected FormData body");
	}

	return body;
};

afterEach(() => {
	globalThis.fetch = originalFetch;
	vi.restoreAllMocks();
});

describe("validateTurnstile", () => {
	it("returns ok on success", async () => {
		const successData: TurnstileResponse = {
			success: true,
			challenge_ts: "2024-01-01T00:00:00Z",
			hostname: "example.com",
		};
		const fetchMock = setFetchResponse(successData);

		const result = await validateTurnstile("token", "203.0.113.5");

		const formData = getFormData(fetchMock);
		expect(formData.get("secret")).toBe("test-secret");
		expect(formData.get("response")).toBe("token");
		expect(formData.get("remoteip")).toBe("203.0.113.5");

		result.match(
			(data) => {
				expect(data).toEqual(successData);
			},
			(error) => {
				throw new Error(`expected ok, got ${error}`);
			},
		);
	});

	it("returns error code when turnstile fails", async () => {
		const fetchMock = setFetchResponse({
			success: false,
			"error-codes": ["timeout-or-duplicate"],
		});

		const result = await validateTurnstile("token", undefined);

		const formData = getFormData(fetchMock);
		expect(formData.get("remoteip")).toBeNull();

		result.match(
			() => {
				throw new Error("expected error");
			},
			(error) => {
				expect(error).toBe("timeout-or-duplicate");
			},
		);
	});

	it("returns internal-error for unknown error codes", async () => {
		setFetchResponse({
			success: false,
			"error-codes": ["unsupported-code"],
		});

		const result = await validateTurnstile("token", undefined);

		result.match(
			() => {
				throw new Error("expected error");
			},
			(error) => {
				expect(error).toBe("internal-error");
			},
		);
	});

	it("returns internal-error when response schema is invalid", async () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		setFetchResponse({
			message: "invalid",
		});

		const result = await validateTurnstile("token", undefined);

		expect(consoleSpy).toHaveBeenCalledOnce();
		result.match(
			() => {
				throw new Error("expected error");
			},
			(error) => {
				expect(error).toBe("internal-error");
			},
		);
	});
});
