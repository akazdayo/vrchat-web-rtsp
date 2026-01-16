/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<void> {
	// Primary: async Clipboard API
	if (navigator?.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	// Fallback: execCommand (older browsers / non-secure contexts)
	const el = document.createElement("textarea");
	el.value = text;
	el.setAttribute("readonly", "");
	el.style.position = "fixed";
	el.style.opacity = "0";
	el.style.pointerEvents = "none";
	document.body.appendChild(el);
	el.select();

	const ok = document.execCommand?.("copy") ?? false;
	document.body.removeChild(el);

	if (!ok) throw new Error("Copy failed");
}
