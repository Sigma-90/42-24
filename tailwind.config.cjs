const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {},
	},

	daisyui: {
		themes: [
			{
				sigma: {
					primary: '#08A',
					secondary: '#CCC',
					accent: '#0A4',
					neutral: '#012',
					'base-100': '#FFF',
					info: '#2AF',
					success: '#2C2',
					warning: '#FC0',
					error: '#C24',
				},
			},
		],
	},

	plugins: [require('@tailwindcss/typography'), require('daisyui')],
};

module.exports = config;
