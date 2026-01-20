import { createFileRoute } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlotReel } from "@/components/SlotReel";
import { copyToClipboard } from "@/lib/clipboard";
import { generateCode } from "@/lib/code-generator";
import { cn } from "@/lib/utils";
import { createWhipClient, getMediamtxOutputUrl } from "@/lib/whip";

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

const SLOT_IDS = ["slot-1", "slot-2", "slot-3", "slot-4"];

export const Route = createFileRoute("/")({
	component: StreamingCodePage,
});

function StreamingCodePage() {
	const reduceMotion = useReducedMotion();
	const [started, setStarted] = useState(false);
	const [code, setCode] = useState("----");
	const [spinKey, setSpinKey] = useState(0);
	const [siteKey, setSiteKey] = useState<string | undefined>(undefined);

	// Turnstile state
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const turnstileWidgetId = useRef<string | null>(null);
	const turnstileRef = useRef<HTMLDivElement>(null);

	const chars = useMemo(() => code.split(""), [code]);
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
			const response = await fetch("/api/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});

			const result = await response.json();
			return result.success === true;
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
		setSpinKey((currentKey) => currentKey + 1);

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
				{/* 4 slots */}
				<div className="flex items-center gap-4" key={spinKey}>
					{started ? (
						SLOT_IDS.map((slotId, index) => (
							<SlotReel
								key={`${spinKey}-${slotId}`}
								target={chars[index] ?? "-"}
								delayMs={reduceMotion ? 0 : index * 30}
								cellPx={48}
								spinSteps={14 + index * 2}
							/>
						))
					) : (
						<>
							<div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
							<div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
							<div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
							<div className="size-12 rounded-lg border border-neutral-500/60 bg-white" />
						</>
					)}
				</div>

				{/* Button */}
				<button
					type="button"
					onClick={onStart}
					disabled={isButtonDisabled}
					className={cn(
						"w-60 rounded-md border border-neutral-500/60 bg-white px-4 py-1.5",
						"text-xs text-neutral-800",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
						"active:scale-[0.99] transition-transform",
						"disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
					)}
				>
					{isVerifying ? "認証中..." : "画面共有"}
				</button>

				{/* Turnstile widget */}
				{siteKey && <div ref={turnstileRef} />}

				{/* Error message */}
				{verifyError && <p className="text-xs text-red-600">{verifyError}</p>}
			</div>
		</div>
	);
}
