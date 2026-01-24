import { z } from "zod";

export const roomValueSchema = z.object({
	createdAt: z.iso.datetime(),
});
export const roomKeySchema = z.string().length(4);

export type roomValue = z.infer<typeof roomValueSchema>;
export type roomKey = z.infer<typeof roomKeySchema>;

export const roomSchema = z.object({
	key: roomKeySchema,
	value: roomValueSchema,
});
export type room = z.infer<typeof roomSchema>;

export const durableObjectErrorSchema = z.enum([
	"unavailable",
	"internal-server-error",
	"bad-request",
]);
export type durableObjectError = z.infer<typeof durableObjectErrorSchema>;

export const roomKeyParamSchema = z.object({
	key: roomKeySchema,
});
