import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ScreenCaptureButton from "@/components/ScreenCaptureButton";
import { Turnstile } from "@/components/Turnstile";
import {
	createWhipClient,
	getMediamtxOutputUrl,
	type WhipClient,
} from "@/lib/whip";
import { verifySession } from "@/utils/newSession.functions";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [capture, setCapture] = useState<MediaStream | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [sessionCode, setSessionCode] = useState<string | null>(null);
	const [failedTurnstile, setFailedTurnstile] = useState(false);
	const [outputUrl, setOutputUrl] = useState<string | null>(null);
	const whipClientRef = useRef<WhipClient | null>(null);

	const handleSuccess = async (token: string) => {
		try {
			const code = await verifySession({ data: { token } });
			setTurnstileToken(token);
			setSessionCode(code);
		} catch {
			setFailedTurnstile(true);
			console.error("Failed to turnstile authentication.");
		}
	};

	useEffect(() => {
		if (!capture || !sessionCode) {
			return;
		}

		const client = createWhipClient();
		whipClientRef.current = client;
		setOutputUrl(getMediamtxOutputUrl(sessionCode));
		void client.start(capture, sessionCode);

		return () => {
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
				}}
			/>
			{outputUrl ? (
				<p>
					配信URL: <a href={outputUrl}>{outputUrl}</a>
				</p>
			) : null}

			<p>
				{failedTurnstile
					? "認証に失敗しました"
					: turnstileToken
						? "認証済み"
						: "認証中"}
			</p>
		</div>
	);
}
