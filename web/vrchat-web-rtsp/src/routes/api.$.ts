import { createFileRoute } from "@tanstack/react-router";
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
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
