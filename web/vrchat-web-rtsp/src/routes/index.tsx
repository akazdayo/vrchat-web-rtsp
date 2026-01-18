import { createFileRoute } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { SlotReel } from "@/components/SlotReel";
import { copyToClipboard } from "@/lib/clipboard";
import { generateCode } from "@/lib/code-generator";
import { cn } from "@/lib/utils";
import { createWhipClient, getMediamtxOutputUrl } from "@/lib/whip";

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

	const chars = useMemo(() => code.split(""), [code]);
	const whipClient = useMemo(() => createWhipClient(), []);

	useEffect(() => {
		setSiteKey(import.meta.env.VITE_SITE_KEY);
	}, []);

	useEffect(() => {
		return () => {
			void whipClient.stop();
		};
	}, [whipClient]);

	async function onStart() {
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
			return;
		}

		const next = generateCode(4);
		const outputUrl = getMediamtxOutputUrl(next);

		try {
			await whipClient.start(stream, next);
		} catch (error) {
			console.error("Failed to publish via WHIP", error);
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
					className={cn(
						"w-60 rounded-md border border-neutral-500/60 bg-white px-4 py-1.5",
						"text-xs text-neutral-800",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
						"active:scale-[0.99] transition-transform",
					)}
				>
					画面共有
				</button>
				{siteKey && <div className="cf-turnstile" data-sitekey={siteKey} />}
			</div>
		</div>
	);
}
