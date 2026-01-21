import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { validateTurnstile } from "./turnstile.server";

const TurnStileInput = z.object({
	token: z.string().max(2048),
});

export const startSession = createServerFn({ method: "POST" })
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
				throw e;
			},
		);
	});
