import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes("dev");
const config = {
	preprocess: vitePreprocess(),
	kit: {
		prerender: {
			handleUnseenRoutes: "warn"
		},
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
			base: dev ? "" : process.env.BASE_PATH,
		},
	}
};

export default config;
