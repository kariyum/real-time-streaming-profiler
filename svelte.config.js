import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes("dev");
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		prerender: {
			handleUnseenRoutes: "warn"
		},
		adapter: adapter(),
		paths: {
			base: dev ? "" : process.env.BASE_PATH,
		},
	}
};

export default config;
