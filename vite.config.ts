import { cloudflare } from "@cloudflare/vite-plugin";
// SSR plugin removed to avoid injecting non-React SSR output during dev
// import ssrPlugin from 'vite-ssr-components/plugin'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [cloudflare({ configPath: "../wrangler.jsonc" }), react()],
	root: "./frontend",
	publicDir: "../public",
	server: {
		port: 5173,
	},
	build: {
		outDir: "../dist",
	},
});
