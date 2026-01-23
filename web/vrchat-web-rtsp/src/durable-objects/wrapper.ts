import { err, ok, type Result } from "neverthrow";
import type { RoomResponse, RoomStub } from "./Room";
import type {
	durableObjectError,
	room,
	roomKey,
	roomValue,
} from "./Room.types";

export class RoomStore {
	constructor(private readonly stub: RoomStub) {}

	private createUrl(path: string): URL {
		return new URL(path, "http://room");
	}

	async get(key: string): Promise<Result<roomValue, durableObjectError>> {
		try {
			const response = await this.stub.fetch(this.createUrl(`/room/${key}`), {
				method: "GET",
			});
			const payload = (await response.json()) as RoomResponse<roomValue>;

			if (!payload.ok) {
				return err(payload.error);
			}
			if (payload.value === undefined) {
				return err("internal-server-error");
			}
			return ok(payload.value);
		} catch {
			return err("internal-server-error");
		}
	}

	async remove(key: roomKey): Promise<Result<void, durableObjectError>> {
		try {
			const response = await this.stub.fetch(this.createUrl(`/room/${key}`), {
				method: "DELETE",
			});
			const payload = (await response.json()) as RoomResponse;

			if (!payload.ok) {
				return err(payload.error);
			}
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}

	async create(data: room): Promise<Result<void, durableObjectError>> {
		try {
			const response = await this.stub.fetch(
				this.createUrl(`/room/${data.key}`),
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data.value),
				},
			);
			const payload = (await response.json()) as RoomResponse;

			if (!payload.ok) {
				return err(payload.error);
			}
			return ok();
		} catch {
			return err("internal-server-error");
		}
	}
}
