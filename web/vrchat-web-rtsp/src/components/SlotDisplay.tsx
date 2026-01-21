import { useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { SlotReel } from "@/components/SlotReel";

const SLOT_IDS = ["slot-1", "slot-2", "slot-3", "slot-4"];

interface SlotDisplayProps {
	started: boolean;
	code: string;
}

export function SlotDisplay({ started, code }: SlotDisplayProps) {
	const reduceMotion = useReducedMotion();
	const chars = useMemo(() => code.split(""), [code]);

	return (
		<div className="flex items-center gap-4">
			{started ? (
				SLOT_IDS.map((slotId, index) => (
					<SlotReel
						key={slotId}
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
	);
}
