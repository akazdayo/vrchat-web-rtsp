import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";
import { generateCode } from "@/lib/code-generator";
import { SlotReel } from "@/components/SlotReel";

export const Route = createFileRoute("/")({
	component: StreamingCodePage,
});

function StreamingCodePage() {
	const reduceMotion = useReducedMotion();
	const [started, setStarted] = useState(false);
	const [code, setCode] = useState("----");
	const [spinKey, setSpinKey] = useState(0);
	const [srMessage, setSrMessage] = useState("");

	const chars = useMemo(() => code.split(""), [code]);

	async function onStart() {
		const next = generateCode(4);
		setStarted(true);
		setCode(next);
		setSpinKey((k) => k + 1);

		// Keep UI identical to the reference: no visible copy toast.
		// Provide SR-only feedback only.
		try {
			await copyToClipboard(next);
			setSrMessage(`Copied ${next}`);
		} catch {
			setSrMessage("Copy failed");
		}
	}

	return (
		<div className="min-h-dvh bg-white grid place-items-center">
			<div className="grid place-items-center gap-3">
				{/* 4 slots */}
				<div className="flex items-center gap-4" key={spinKey}>
					{started ? (
						chars.map((ch, i) => (
							<SlotReel
								key={`${spinKey}-${i}`}
								target={ch}
								delayMs={reduceMotion ? 0 : i * 30}
								cellPx={48}
								spinSteps={14 + i * 2}
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

				{/* Screen-reader-only feedback for copy result */}
				<div className="sr-only" aria-live="polite">
					{srMessage}
				</div>
			</div>
		</div>
	);
}
