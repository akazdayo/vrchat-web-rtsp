import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ScreenCaptureButton from "@/components/ScreenCaptureButton";
import { Turnstile } from "@/components/Turnstile";

export const Route = createFileRoute("/newPage")({
	component: RouteComponent,
});

function RouteComponent() {
	const [capture, setCapture] = useState<MediaStream | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	return (
		<div>
			<ScreenCaptureButton setCapture={setCapture} />
			<Turnstile
				onSuccess={setTurnstileToken}
				onExpired={() => setTurnstileToken(null)}
			/>
			<p>{turnstileToken ? "認証済み" : "認証してください"}</p>
		</div>
	);
}
