import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
	},

	preprocess: [
		preprocess({
			postcss: true,
		}),
		mdsvex({
			extensions: ['.md'],
		}),
	],
};

export default config;
