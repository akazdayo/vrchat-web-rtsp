declare global {
	interface ImportMetaEnv {
		VITE_SITE_KEY?: string;
		VITE_DEV_SKIP_TURNSTILE?: string;
	}
}

export {};
