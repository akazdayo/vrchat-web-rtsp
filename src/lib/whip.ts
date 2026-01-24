const DEFAULT_WHIP_ENDPOINT_BASE = "http://localhost:8889";
const DEFAULT_MEDIAMTX_OUTPUT_BASE = "rtsp://localhost:8554";
const ENV_WHIP_ENDPOINT_BASE = import.meta.env.VITE_WHIP_ENDPOINT?.trim();
const ENV_MEDIAMTX_OUTPUT_BASE =
	import.meta.env.VITE_MEDIAMTX_OUTPUT_URL?.trim();

type WhipClientOptions = {
	endpointBase?: string;
};

export type WhipClient = {
	start: (stream: MediaStream, path: string) => Promise<void>;
	stop: () => Promise<void>;
};

function normalizeWhipEndpointBase(value: string) {
	try {
		return new URL(value).origin;
	} catch {
		return value.replace(/\/+$/, "");
	}
}

function normalizeOutputBase(value: string) {
	try {
		const url = new URL(value);
		return `${url.protocol}//${url.host}`;
	} catch {
		return value.replace(/\/+$/, "");
	}
}

export function getMediamtxOutputUrl(path: string) {
	const base = ENV_MEDIAMTX_OUTPUT_BASE || DEFAULT_MEDIAMTX_OUTPUT_BASE;
	return `${normalizeOutputBase(base)}/${path}`;
}

async function waitForIceGatheringComplete(peerConnection: RTCPeerConnection) {
	if (peerConnection.iceGatheringState === "complete") {
		return;
	}

	await new Promise<void>((resolve) => {
		const onStateChange = () => {
			if (peerConnection.iceGatheringState === "complete") {
				peerConnection.removeEventListener(
					"icegatheringstatechange",
					onStateChange,
				);
				resolve();
			}
		};

		peerConnection.addEventListener("icegatheringstatechange", onStateChange);
	});
}

export function createWhipClient(options: WhipClientOptions = {}): WhipClient {
	const whipEndpointBase = normalizeWhipEndpointBase(
		options.endpointBase?.trim() ||
			ENV_WHIP_ENDPOINT_BASE ||
			DEFAULT_WHIP_ENDPOINT_BASE,
	);
	let peerConnection: RTCPeerConnection | null = null;
	let whipResourceUrl: string | null = null;
	let activeStream: MediaStream | null = null;

	const stop = async () => {
		const currentPeerConnection = peerConnection;
		peerConnection = null;

		if (currentPeerConnection) {
			currentPeerConnection.getSenders().forEach((sender) => {
				sender.track?.stop();
			});
			currentPeerConnection.close();
		}

		const currentStream = activeStream;
		activeStream = null;

		if (currentStream) {
			currentStream.getTracks().forEach((track) => {
				track.stop();
			});
		}

		const currentResourceUrl = whipResourceUrl;
		whipResourceUrl = null;

		if (!currentResourceUrl) {
			return;
		}

		try {
			await fetch(currentResourceUrl, {
				method: "DELETE",
			});
		} catch (error) {
			console.error("Failed to delete WHIP resource", error);
		}
	};

	const start = async (stream: MediaStream, path: string) => {
		await stop();

		const connection = new RTCPeerConnection();
		peerConnection = connection;
		activeStream = stream;

		const onTrackEnded = () => {
			void stop();
		};

		stream.getTracks().forEach((track) => {
			connection.addTrack(track, stream);
			track.addEventListener("ended", onTrackEnded);
		});

		try {
			const offer = await connection.createOffer();
			await connection.setLocalDescription(offer);
			await waitForIceGatheringComplete(connection);

			const localDescription = connection.localDescription;
			if (!localDescription?.sdp) {
				throw new Error("Failed to create SDP offer");
			}

			const whipEndpoint = `${whipEndpointBase.replace(/\/+$/, "")}/${path}/whip`;
			const response = await fetch(whipEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/sdp",
					Accept: "application/sdp",
				},
				body: localDescription.sdp,
			});

			if (!response.ok) {
				throw new Error(`WHIP request failed: ${response.status}`);
			}

			const locationHeader = response.headers.get("Location");
			if (locationHeader) {
				whipResourceUrl = new URL(locationHeader, whipEndpoint).toString();
			}

			const answerSdp = await response.text();
			await connection.setRemoteDescription({
				type: "answer",
				sdp: answerSdp,
			});
		} catch (error) {
			await stop();
			throw error;
		}
	};

	return { start, stop };
}
