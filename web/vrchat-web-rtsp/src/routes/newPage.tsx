import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ScreenCaptureButton from "@/components/ScreenCaptureButton";
import { Turnstile } from "@/components/Turnstile";
import { createWhipClient, type WhipClient } from "@/lib/whip";
import { verifySession } from "@/utils/newSession.functions";

export const Route = createFileRoute("/newPage")({
	component: RouteComponent,
});

function RouteComponent() {
	const [capture, setCapture] = useState<MediaStream | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [failedTurnstile, setFailedTurnstile] = useState(false);
	const whipClientRef = useRef<WhipClient | null>(null);

	const handleSuccess = async (token: string) => {
		try {
			await verifySession({ data: { token } });
			setTurnstileToken(token);
		} catch {
			setFailedTurnstile(true);
			console.error("Failed to turnstile authentication.");
		}
	};

	useEffect(() => {
		if (!capture) {
			return;
		}

		const client = createWhipClient();
		whipClientRef.current = client;
		void client.start(capture, "test");

		return () => {
			void client.stop();
		};
	}, [capture]);

	return (
		<div>
			<ScreenCaptureButton setCapture={setCapture} />
			<Turnstile
				onSuccess={handleSuccess}
				onExpired={() => setTurnstileToken(null)}
			/>
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
