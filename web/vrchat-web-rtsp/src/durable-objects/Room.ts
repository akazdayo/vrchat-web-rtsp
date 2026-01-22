import { DurableObject } from "cloudflare:workers";

export class Room extends DurableObject<Env> {
	async getState(): Promise<unknown> {
		const data = await this.ctx.storage.get("roomData");
		return data ?? {};
	}

	async updateState(data: unknown): Promise<void> {
		await this.ctx.storage.put("roomData", data);
	}

	async clearState(): Promise<void> {
		await this.ctx.storage.deleteAll();
	}
}
