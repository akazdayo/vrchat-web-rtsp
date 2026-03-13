import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ScreenCaptureButton from "@/components/ScreenCaptureButton";
import { Turnstile } from "@/components/Turnstile";
import { createWhipClient, getMediamtxOutputUrl } from "@/lib/whip";
import { verifySession } from "@/utils/newSession.functions";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [capture, setCapture] = useState<MediaStream | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [sessionCode, setSessionCode] = useState<string | null>(null);
	const [failedTurnstile, setFailedTurnstile] = useState(false);
	const [turnstileError, setTurnstileError] = useState<string | null>(null);
	const [outputUrl, setOutputUrl] = useState<string | null>(null);
	const [broadcastState, setBroadcastState] = useState<
		"idle" | "connecting" | "live" | "error"
	>("idle");
	const [broadcastError, setBroadcastError] = useState<string | null>(null);

	const handleSuccess = async (token: string) => {
		const result = await verifySession({ data: { token } });
		if (result.success) {
			setTurnstileToken(token);
			setSessionCode(result.code);
			setFailedTurnstile(false);
			setTurnstileError(null);
		} else {
			setFailedTurnstile(true);
			setTurnstileError(result.error ?? null);
			console.error("Failed to turnstile authentication.", result.error);
		}
	};

	useEffect(() => {
		if (!capture) {
			return;
		}

		const onTrackEnded = () => {
			setCapture(null);
			setOutputUrl(null);
			setBroadcastError(null);
			setBroadcastState("idle");
		};

		capture.getTracks().forEach((track) => {
			track.addEventListener("ended", onTrackEnded);
		});

		return () => {
			capture.getTracks().forEach((track) => {
				track.removeEventListener?.("ended", onTrackEnded);
			});
		};
	}, [capture]);

	useEffect(() => {
		if (!capture || !sessionCode) {
			setOutputUrl(null);
			setBroadcastError(null);
			setBroadcastState("idle");
			return;
		}

		const client = createWhipClient();
		let cancelled = false;

		setBroadcastState("connecting");
		setBroadcastError(null);
		setOutputUrl(null);

		void (async () => {
			try {
				await client.start(capture, sessionCode);
				if (cancelled) {
					return;
				}

				setOutputUrl(getMediamtxOutputUrl(sessionCode));
				setBroadcastState("live");
			} catch (error) {
				if (cancelled) {
					return;
				}

				console.error("Failed to start WHIP broadcast.", error);
				setOutputUrl(null);
				setBroadcastState("error");
				setBroadcastError(
					error instanceof Error ? error.message : "配信開始に失敗しました",
				);
			}
		})();

		return () => {
			cancelled = true;
			void client.stop();
		};
	}, [capture, sessionCode]);

	return (
		<div>
			<ScreenCaptureButton setCapture={setCapture} />
			<Turnstile
				onSuccess={handleSuccess}
				onExpired={() => {
					setTurnstileToken(null);
					setSessionCode(null);
					setOutputUrl(null);
					setBroadcastError(null);
					setBroadcastState("idle");
					setFailedTurnstile(false);
					setTurnstileError(null);
				}}
			/>
			{outputUrl ? (
				<p>
					配信URL: <a href={outputUrl}>{outputUrl}</a>
				</p>
			) : null}

			<p>
				{failedTurnstile
					? turnstileError
						? `認証に失敗しました (${turnstileError})`
						: "認証に失敗しました"
					: turnstileToken
						? "認証済み"
						: "認証中"}
			</p>
			<p>
				{broadcastState === "connecting"
					? "配信接続中"
					: broadcastState === "live"
						? "配信中"
						: broadcastState === "error"
							? broadcastError
								? `配信エラー (${broadcastError})`
								: "配信エラー"
							: capture && sessionCode
								? "配信待機中"
								: "未配信"}
			</p>
		</div>
	);
}
