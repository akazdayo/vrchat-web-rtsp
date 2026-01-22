import { DurableObject } from "cloudflare:workers";
import { err, ok, type Result } from "neverthrow";
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

export class Room extends DurableObject<Env> {
	async get(key: string): Promise<Result<roomValue, durableObjectError>> {
		const parsed = roomKeySchema.safeParse(key);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			const data: any | undefined = await this.ctx.storage.get(parsed.data);
			if (data === undefined) {
				return err("unavailable");
			}
			const result = roomValueSchema.safeParse(data);

			if (result.success !== true) {
				return err("internal-server-error");
			}
			return ok(result.data);
		} catch {
			return err("internal-server-error");
		}
	}

	async remove(
		key: roomKey,
	): Promise<Result<void, Exclude<durableObjectError, "unavailable">>> {
		const parsed = roomKeySchema.safeParse(key);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			await this.ctx.storage.delete(parsed.data);
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}

	async create(
		data: room,
	): Promise<Result<void, Exclude<durableObjectError, "unavailable">>> {
		const parsed = roomSchema.safeParse(data);
		if (parsed.success !== true) {
			return err("bad-request");
		}

		try {
			await this.ctx.storage.put(parsed.data.key, parsed.data.value);
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}
}
