const CHARSET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a random character from the charset
 */
export function randomChar(rng: () => number = Math.random): string {
	return CHARSET[Math.floor(rng() * CHARSET.length)];
}

/**
 * Generate a random code of specified length
 */
export function generateCode(len = 4, rng: () => number = Math.random): string {
	let s = "";
	for (let i = 0; i < len; i++) s += randomChar(rng);
	return s;
}
