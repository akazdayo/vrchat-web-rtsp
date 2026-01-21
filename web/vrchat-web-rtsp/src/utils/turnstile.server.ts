import { env } from "cloudflare:workers";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import {
	type TurnstileResponse,
	turnstileResponseSchema,
} from "./types/turnstile";

const secretKey = env.TURNSTILE_SECRET_KEY;
export const TurnstileErrorCodeSchema = z.enum([
	"missing-input-secret",
	"invalid-input-secret",
	"missing-input-response",
	"invalid-input-response",
	"bad-request",
	"timeout-or-duplicate",
	"internal-error",
]);
type ErrorCode = z.infer<typeof TurnstileErrorCodeSchema>;

export async function validateTurnstile(
	token: string,
	remoteip: string | undefined,
): Promise<Result<TurnstileResponse, ErrorCode>> {
	const formData = new FormData();
	formData.append("secret", secretKey);
	formData.append("response", token);
	if (remoteip) {
		formData.append("remoteip", remoteip);
	}

	const response = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			body: formData,
		},
	);

	const parsed = turnstileResponseSchema.safeParse(await response.json());
	if (!parsed.success) {
		console.log(parsed.error);
		return err("internal-error");
	}

	const data = parsed.data;
	if (!data.success) {
		const errorCode = data["error-codes"][0];
		const errorParsed = TurnstileErrorCodeSchema.safeParse(errorCode);
		return err(errorParsed.success ? errorParsed.data : "internal-error");
	}
	return ok(data);
}
