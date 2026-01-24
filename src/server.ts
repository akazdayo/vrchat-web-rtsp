import type { Register } from "@tanstack/react-router";
import {
	createStartHandler,
	defaultStreamHandler,
	type RequestHandler,
} from "@tanstack/react-start/server";
import { Room } from "@/durable-objects/Room";

const fetch = createStartHandler(defaultStreamHandler);

export type ServerEntry = { fetch: RequestHandler<Register> };

type FetchArgs = Parameters<ServerEntry["fetch"]>;

export function createServerEntry(entry: ServerEntry): ServerEntry {
	return {
		async fetch(...args: FetchArgs) {
			return await entry.fetch(...args);
		},
	};
}

export { Room };

export default createServerEntry({ fetch });
