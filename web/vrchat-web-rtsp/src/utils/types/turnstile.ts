import { z } from "zod";

const successSchema = z.object({
	success: z.literal(true),
	challenge_ts: z.string(), // ISO8601 だけど string で十分なことが多い
	hostname: z.string(),
	"error-codes": z.array(z.string()).optional(),
	action: z.string().optional(),
	cdata: z.string().optional(),
	metadata: z
		.object({
			ephemeral_id: z.string().optional(),
		})
		.optional(),
});

const failedSchema = z.object({
	success: z.literal(false),
	"error-codes": z.array(z.string()).min(1),
	metadata: z
		.object({
			ephemeral_id: z.string().optional(),
		})
		.optional(),
});

export const turnstileResponseSchema = z.discriminatedUnion("success", [
	successSchema,
	failedSchema,
]);

// 型も欲しければ
export type TurnstileResponse = z.infer<typeof turnstileResponseSchema>;
