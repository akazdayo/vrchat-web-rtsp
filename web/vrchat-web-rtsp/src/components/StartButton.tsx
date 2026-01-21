import { cn } from "@/lib/utils";

interface StartButtonProps {
	onStart: () => void;
	disabled: boolean;
}

export function StartButton({ onStart, disabled }: StartButtonProps) {
	return (
		<button
			type="button"
			onClick={onStart}
			disabled={disabled}
			className={cn(
				"w-60 rounded-md border border-neutral-500/60 bg-white px-4 py-1.5",
				"text-xs text-neutral-800",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
				"active:scale-[0.99] transition-transform",
				"disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
			)}
		>
			画面共有
		</button>
	);
}
