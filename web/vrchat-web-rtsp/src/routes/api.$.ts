import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { Hono } from "hono";

interface TurnstileVerifyResponse {
	success: boolean;
	challenge_ts?: string;
	hostname?: string;
	"error-codes"?: string[];
	action?: string;
	cdata?: string;
}

const app = new Hono().basePath("/api");

app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

app.post("/verify", async (c) => {
	let body: { token: string };
	try {
		body = await c.req.json<{ token: string }>();
	} catch {
		return c.json({ success: false, error: "Invalid JSON body" }, 400);
	}
	const token = body.token;

	if (!token || typeof token !== "string") {
		return c.json({ success: false, error: "Token is required" }, 400);
	}

	if (token.length > 2048) {
		return c.json({ success: false, error: "Token too long" }, 400);
	}

	const secretKey = (env as { TURNSTILE_SECRET_KEY?: string })
		.TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		console.error("TURNSTILE_SECRET_KEY is not configured");
		return c.json({ success: false, error: "Internal Server Error" }, 500);
	}

	const remoteip =
		c.req.header("CF-Connecting-IP") ??
		c.req.header("X-Forwarded-For") ??
		undefined;

	const formData = new FormData();
	formData.append("secret", secretKey);
	formData.append("response", token);
	if (remoteip) {
		formData.append("remoteip", remoteip);
	}

	try {
		const response = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: formData,
			},
		);

		const result: TurnstileVerifyResponse = await response.json();

		if (result.success) {
			return c.json({ success: true });
		}

		return c.json(
			{
				success: false,
				error: "Verification failed",
				"error-codes": result["error-codes"],
			},
			400,
		);
	} catch (error) {
		console.error("Turnstile validation error:", error);
		return c.json(
			{ success: false, error: "Verification request failed" },
			500,
		);
	}
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
