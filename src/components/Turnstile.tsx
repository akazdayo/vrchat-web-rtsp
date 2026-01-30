import { useEffect, useRef } from "react";

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

interface TurnstileProps {
	onSuccess: (token: string) => void;
	onExpired?: () => void;
}

const siteKey = import.meta.env.VITE_SITE_KEY;

export function Turnstile({ onSuccess, onExpired }: TurnstileProps) {
	const ref = useRef<HTMLDivElement>(null);
	const widgetId = useRef<string | null>(null);

	useEffect(() => {
		if (!siteKey || !ref.current) return;

		const render = () => {
			if (!window.turnstile || !ref.current) return;
			ref.current.innerHTML = "";
			widgetId.current = window.turnstile.render(ref.current, {
				sitekey: siteKey,
				callback: onSuccess,
				"expired-callback": onExpired,
			});
		};

		if (window.turnstile) {
			render();
		} else {
			const id = setInterval(() => {
				if (window.turnstile) {
					clearInterval(id);
					render();
				}
			}, 100);
			return () => clearInterval(id);
		}
	}, [onSuccess, onExpired]);

	if (!siteKey) return null;
	return <div ref={ref} data-size="normal"/>;
}
