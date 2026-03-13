import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWhipClient, getMediamtxOutputUrl } from "@/lib/whip";

type EventListenerWrapper = EventListenerOrEventListenerObject;

class MockMediaStreamTrack {
	stop = vi.fn();
	private readonly listeners = new Map<EventListenerWrapper, () => void>();

	addEventListener(type: string, listener: EventListenerWrapper) {
		if (type !== "ended") {
			return;
		}

		const callback =
			typeof listener === "function"
				? () => listener(new Event("ended"))
				: () => listener.handleEvent(new Event("ended"));
		this.listeners.set(listener, callback);
	}

	removeEventListener(type: string, listener: EventListenerWrapper) {
		if (type !== "ended") {
			return;
		}

		this.listeners.delete(listener);
	}

	dispatchEnded() {
		for (const callback of this.listeners.values()) {
			callback();
		}
	}
}

class MockMediaStream {
	constructor(private readonly tracks: MediaStreamTrack[]) {}

	getTracks() {
		return this.tracks;
	}
}

class MockRTCPeerConnection {
	static instances: MockRTCPeerConnection[] = [];
	static nextIceGatheringState: RTCIceGatheringState = "complete";
	static nextIceConnectionState: RTCIceConnectionState = "new";
	static nextConnectionState: RTCPeerConnectionState = "new";
	static autoConnectOnRemoteDescription = true;

	iceGatheringState: RTCIceGatheringState;
	iceConnectionState: RTCIceConnectionState;
	connectionState: RTCPeerConnectionState;
	localDescription: RTCSessionDescriptionInit | null = null;
	remoteDescription: RTCSessionDescriptionInit | null = null;

	private readonly listeners = new Map<
		| "connectionstatechange"
		| "iceconnectionstatechange"
		| "icegatheringstatechange",
		Map<EventListenerWrapper, () => void>
	>([
		["connectionstatechange", new Map()],
		["iceconnectionstatechange", new Map()],
		["icegatheringstatechange", new Map()],
	]);
	private readonly senders: RTCRtpSender[] = [];

	close = vi.fn();
	createOffer = vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" }));
	setLocalDescription = vi.fn(
		async (description: RTCSessionDescriptionInit) => {
			this.localDescription = description;
		},
	);
	setRemoteDescription = vi.fn(
		async (description: RTCSessionDescriptionInit) => {
			this.remoteDescription = description;
			if (MockRTCPeerConnection.autoConnectOnRemoteDescription) {
				queueMicrotask(() => {
					this.setConnected();
				});
			}
		},
	);

	constructor() {
		this.iceGatheringState = MockRTCPeerConnection.nextIceGatheringState;
		this.iceConnectionState = MockRTCPeerConnection.nextIceConnectionState;
		this.connectionState = MockRTCPeerConnection.nextConnectionState;
		MockRTCPeerConnection.instances.push(this);
	}

	addTrack(track: MediaStreamTrack): RTCRtpSender {
		const sender = { track } as unknown as RTCRtpSender;
		this.senders.push(sender);
		return sender;
	}

	getSenders() {
		return this.senders;
	}

	addEventListener(type: string, listener: EventListenerWrapper) {
		if (
			type !== "icegatheringstatechange" &&
			type !== "iceconnectionstatechange" &&
			type !== "connectionstatechange"
		) {
			return;
		}

		const callback =
			typeof listener === "function"
				? () => listener(new Event(type))
				: () => listener.handleEvent(new Event(type));
		this.listeners.get(type)?.set(listener, callback);
	}

	removeEventListener(type: string, listener: EventListenerWrapper) {
		if (
			type !== "icegatheringstatechange" &&
			type !== "iceconnectionstatechange" &&
			type !== "connectionstatechange"
		) {
			return;
		}

		this.listeners.get(type)?.delete(listener);
	}

	completeIceGathering() {
		this.iceGatheringState = "complete";
		for (const callback of this.listeners
			.get("icegatheringstatechange")
			?.values() ?? []) {
			callback();
		}
	}

	setConnected() {
		this.connectionState = "connected";
		this.iceConnectionState = "connected";

		for (const callback of this.listeners
			.get("connectionstatechange")
			?.values() ?? []) {
			callback();
		}
		for (const callback of this.listeners
			.get("iceconnectionstatechange")
			?.values() ?? []) {
			callback();
		}
	}
}

const originalFetch = globalThis.fetch;
const originalPeerConnection = globalThis.RTCPeerConnection;

const installFetchMock = (
	implementation: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>,
): ReturnType<typeof vi.fn> => {
	const fetchMock = vi.fn(implementation);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	return fetchMock;
};

const createStream = (): {
	stream: MediaStream;
	track: MockMediaStreamTrack;
} => {
	const track = new MockMediaStreamTrack();
	const stream = new MockMediaStream([track as unknown as MediaStreamTrack]);

	return {
		stream: stream as unknown as MediaStream,
		track,
	};
};

beforeEach(() => {
	MockRTCPeerConnection.instances = [];
	MockRTCPeerConnection.nextIceGatheringState = "complete";
	MockRTCPeerConnection.nextIceConnectionState = "new";
	MockRTCPeerConnection.nextConnectionState = "new";
	MockRTCPeerConnection.autoConnectOnRemoteDescription = true;
	globalThis.RTCPeerConnection =
		MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	globalThis.RTCPeerConnection = originalPeerConnection;
	vi.restoreAllMocks();
});

describe("whip client", () => {
	it("builds MediaMTX output URL from default base", () => {
		expect(getMediamtxOutputUrl("ABCD")).toBe("rtsp://localhost:8554/ABCD");
	});

	it("starts and stops a WHIP session", async () => {
		const fetchMock = installFetchMock(async (_input, init) => {
			if (init?.method === "POST") {
				return new Response("answer-sdp", {
					status: 201,
					headers: { Location: "/session/1" },
				});
			}

			if (init?.method === "DELETE") {
				return new Response(null, { status: 204 });
			}

			throw new Error("Unexpected request");
		});
		const { stream, track } = createStream();
		const client = createWhipClient({
			endpointBase: "http://localhost:8889///",
		});

		await client.start(stream, "ABCD");

		const connection = MockRTCPeerConnection.instances[0];
		expect(connection).toBeDefined();
		if (!connection) {
			throw new Error("RTCPeerConnection was not created");
		}

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"http://localhost:8889/ABCD/whip",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/sdp",
					Accept: "application/sdp",
				},
				body: "offer-sdp",
			},
		);
		expect(connection.setRemoteDescription).toHaveBeenCalledWith({
			type: "answer",
			sdp: "answer-sdp",
		});

		await client.stop();

		expect(connection.close).toHaveBeenCalledOnce();
		expect(track.stop).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"http://localhost:8889/session/1",
			{
				method: "DELETE",
			},
		);
	});

	it("cleans up when WHIP POST fails", async () => {
		const fetchMock = installFetchMock(
			async () =>
				new Response("failed", {
					status: 500,
				}),
		);
		const { stream, track } = createStream();
		const client = createWhipClient({
			endpointBase: "http://localhost:8889/ingest/base",
		});

		await expect(client.start(stream, "ABCD")).rejects.toThrow(
			"WHIP request failed: 500",
		);

		const connection = MockRTCPeerConnection.instances[0];
		expect(connection).toBeDefined();
		if (!connection) {
			throw new Error("RTCPeerConnection was not created");
		}

		expect(connection.close).toHaveBeenCalledOnce();
		expect(track.stop).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith("http://localhost:8889/ABCD/whip", {
			method: "POST",
			headers: {
				"Content-Type": "application/sdp",
				Accept: "application/sdp",
			},
			body: "offer-sdp",
		});
	});

	it("waits for ICE gathering completion before WHIP POST", async () => {
		MockRTCPeerConnection.nextIceGatheringState = "gathering";
		const fetchMock = installFetchMock(
			async () =>
				new Response("answer-sdp", {
					status: 201,
				}),
		);
		const { stream } = createStream();
		const client = createWhipClient({ endpointBase: "http://localhost:8889" });

		const startPromise = client.start(stream, "ABCD");
		await Promise.resolve();

		expect(fetchMock).not.toHaveBeenCalled();

		const connection = MockRTCPeerConnection.instances[0];
		expect(connection).toBeDefined();
		if (!connection) {
			throw new Error("RTCPeerConnection was not created");
		}

		connection.completeIceGathering();

		await startPromise;
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it("fails when media transport never becomes active", async () => {
		MockRTCPeerConnection.autoConnectOnRemoteDescription = false;
		const fetchMock = installFetchMock(
			async () =>
				new Response("answer-sdp", {
					status: 201,
				}),
		);
		const { stream, track } = createStream();
		const client = createWhipClient({
			endpointBase: "http://localhost:8889",
			connectionTimeoutMs: 20,
		});

		await expect(client.start(stream, "ABCD")).rejects.toThrow(
			"WHIP connection timed out after 20ms before media became active",
		);

		const connection = MockRTCPeerConnection.instances[0];
		expect(connection).toBeDefined();
		if (!connection) {
			throw new Error("RTCPeerConnection was not created");
		}

		expect(connection.close).toHaveBeenCalledOnce();
		expect(track.stop).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
