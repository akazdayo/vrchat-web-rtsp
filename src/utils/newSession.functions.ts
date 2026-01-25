import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { RoomStub } from "@/durable-objects/Room";
import { RoomStore } from "@/durable-objects/wrapper";
import { validateTurnstile } from "./turnstile.server";

const TurnStileInput = z.object({
	token: z.string().max(2048),
});

function generateRandomCode() {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code = "";
	for (let i = 0; i < 4; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		code += chars[randomIndex];
	}
	return code;
}

export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(TurnStileInput)
	.handler(async ({ data }) => {
		const remoteip =
			getRequestHeader("CF-Connecting-IP") ??
			getRequestHeader("X-Forwarded-For") ??
			undefined;
		const turnstileResult = await validateTurnstile(data.token, remoteip);

		// エラーだった時にthrowする
		turnstileResult.match(
			(ok) => ok,
			(e) => {
				console.error(e);
				throw e;
			},
		);

		const code = generateRandomCode();
		const roomStore = new RoomStore(
			env.ROOM.get(env.ROOM.idFromName("room")) as RoomStub,
		);
		const created = await roomStore.create({
			key: code,
			value: { createdAt: new Date().toISOString() },
		});
		if (created.isErr()) {
			console.error(created.error);
			throw created.error;
		}
		return code;
	});
