import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InlineMessage } from "@/components/InlineMessage";
import { SlotDisplay } from "@/components/SlotDisplay";
import { StartButton } from "@/components/StartButton";
import { copyToClipboard } from "@/lib/clipboard";
import { generateCode } from "@/lib/code-generator";
import { createWhipClient, getMediamtxOutputUrl } from "@/lib/whip";
import { verifySession } from "@/utils/newSession.functions";

declare global {
	interface Window {
		turnstile?: {
			reset: (widgetId?: string) => void;
			render: (
				container: string | HTMLElement,
				options: Record<string, unknown>,
			) => string;
		};
	}
}

export const Route = createFileRoute("/")({
	component: StreamingCodePage,
});

function StreamingCodePage() {
	const [started, setStarted] = useState(false);
	const [code, setCode] = useState("----");
	const [siteKey, setSiteKey] = useState<string | undefined>(undefined);

	// Turnstile state
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const turnstileWidgetId = useRef<string | null>(null);
	const turnstileRef = useRef<HTMLDivElement>(null);

	const whipClient = useMemo(() => createWhipClient(), []);

	const isButtonDisabled = !turnstileToken || isVerifying;

	// Turnstile callback handlers
	const handleTurnstileSuccess = useCallback((token: string) => {
		setTurnstileToken(token);
		setVerifyError(null);
	}, []);

	const handleTurnstileError = useCallback(() => {
		setTurnstileToken(null);
		setVerifyError("認証に失敗しました。再試行してください。");
	}, []);

	const handleTurnstileExpired = useCallback(() => {
		setTurnstileToken(null);
		setVerifyError("認証の有効期限が切れました。再試行してください。");
	}, []);

	// Reset Turnstile widget
	const resetTurnstile = useCallback(() => {
		if (window.turnstile && turnstileWidgetId.current) {
			window.turnstile.reset(turnstileWidgetId.current);
		}
		setTurnstileToken(null);
		setVerifyError(null);
	}, []);

	useEffect(() => {
		setSiteKey(import.meta.env.VITE_SITE_KEY);
	}, []);

	// Render Turnstile widget manually to capture callbacks
	useEffect(() => {
		if (!siteKey || !turnstileRef.current) return;

		const renderWidget = () => {
			if (!window.turnstile || !turnstileRef.current) return;

			// Clear any existing widget
			turnstileRef.current.innerHTML = "";

			turnstileWidgetId.current = window.turnstile.render(
				turnstileRef.current,
				{
					sitekey: siteKey,
					callback: handleTurnstileSuccess,
					"error-callback": handleTurnstileError,
					"expired-callback": handleTurnstileExpired,
				},
			);
		};

		// Wait for turnstile script to load
		if (window.turnstile) {
			renderWidget();
		} else {
			const checkInterval = setInterval(() => {
				if (window.turnstile) {
					clearInterval(checkInterval);
					renderWidget();
				}
			}, 100);

			return () => clearInterval(checkInterval);
		}
	}, [
		siteKey,
		handleTurnstileSuccess,
		handleTurnstileError,
		handleTurnstileExpired,
	]);

	useEffect(() => {
		return () => {
			void whipClient.stop();
		};
	}, [whipClient]);

	async function verifyTurnstileToken(token: string): Promise<boolean> {
		try {
			const verify = useServerFn(verifySession);
			const { data } = useQuery({
				queryKey: ["verify"],
				queryFn: () => verify({ data: { token } }),
			});
      console.log(`verify: ${data}`)
			return data?.success === true;
		} catch (error) {
			console.error("Turnstile verification failed:", error);
			return false;
		}
	}

	async function onStart() {
		if (!turnstileToken) {
			setVerifyError("認証を完了してください。");
			return;
		}

		setIsVerifying(true);
		setVerifyError(null);

		// Verify Turnstile token with backend
		const isValid = await verifyTurnstileToken(turnstileToken);

		if (!isValid) {
			setIsVerifying(false);
			setVerifyError("認証に失敗しました。再試行してください。");
			resetTurnstile();
			return;
		}

		setIsVerifying(false);

		let screenShareMessage = "";
		let stream: MediaStream | null = null;

		if (navigator.mediaDevices?.getDisplayMedia) {
			try {
				stream = await navigator.mediaDevices.getDisplayMedia({
					video: true,
					audio: true,
				});
			} catch {
				screenShareMessage = "Screen share canceled";
			}
		} else {
			screenShareMessage = "Screen share not supported";
		}

		if (!stream) {
			if (screenShareMessage) {
				console.error(screenShareMessage);
			}
			// Reset Turnstile for next attempt since token is single-use
			resetTurnstile();
			return;
		}

		const next = generateCode(4);
		const outputUrl = getMediamtxOutputUrl(next);

		try {
			await whipClient.start(stream, next);
		} catch (error) {
			console.error("Failed to publish via WHIP", error);
			resetTurnstile();
			return;
		}

		setStarted(true);
		setCode(next);

		// Keep UI identical to the reference: no visible copy toast.
		// Provide SR-only feedback only.
		try {
			await copyToClipboard(outputUrl);
		} catch {
			console.error("Copy failed");
		}
	}

	return (
		<div className="min-h-dvh bg-white grid place-items-center">
			<div className="grid place-items-center gap-3">
				<SlotDisplay started={started} code={code} />

				<StartButton onStart={onStart} disabled={isButtonDisabled} />

				{siteKey && <div ref={turnstileRef} />}

				<InlineMessage message={verifyError} className="text-xs text-red-600" />
			</div>
		</div>
	);
}
