<script>
	import { onMount } from 'svelte';

	export let show = false;
	export let title = 'Lade...';
	export let backdrop = 'default';
	export let background = 'default';
	export let appearance = 'default';
	export let sphereStyle = '3d';
	export let fallbackTimeMs = 0;

	let isClosed = true;
	let isClosing = false;
	let isOpen = false;
	let isOpening = false;
	/**
	 * @type {{ offsetWidth: any; offsetHeight: any; getContext: (arg0: string) => any; }}
	 */
	let canvasElement;
	/**
	 * @type {string | number | NodeJS.Timeout | undefined}
	 */
	let spinnerFallbackTimeout;
	/**
	 * @type {string | number | NodeJS.Timeout | undefined}
	 */
	let introOutroTimeout;

	const showOrbitLoader = function () {
		if (introOutroTimeout) {
			clearTimeout(introOutroTimeout);
		}
		isOpen = false;
		isOpening = true;
		isClosed = false;
		isClosing = false;
		introOutroTimeout = setTimeout(function () {
			isOpen = true;
			isOpening = false;
			isClosed = false;
			isClosing = false;
		}, 240);
		if (fallbackTimeMs) {
			spinnerFallbackTimeout = setTimeout(function () {
				hideOrbitLoader();
			}, fallbackTimeMs);
		} else {
			spinnerFallbackTimeout = undefined;
		}
	};

	const hideOrbitLoader = function () {
		if (spinnerFallbackTimeout) {
			clearTimeout(spinnerFallbackTimeout);
		}
		if (introOutroTimeout) {
			clearTimeout(introOutroTimeout);
		}
		isOpen = false;
		isOpening = false;
		isClosed = false;
		isClosing = true;
		introOutroTimeout = setTimeout(function () {
			isOpen = false;
			isOpening = false;
			isClosed = true;
			isClosing = false;
		}, 240);
	};

	const createStarrySky = function (/** @type {{ offsetWidth: any; offsetHeight: any; getContext: any; }} */ canvas) {
		const starDensity = 97.2;
		const sparklingPercentage = 1;
		const dynamic = true;

		// @ts-ignore
		window.requestAnimFrame = (function (callback) {
			// @ts-ignore
			return (
				window.requestAnimationFrame ||
				// @ts-ignore
				window.webkitRequestAnimationFrame ||
				// @ts-ignore
				window.mozRequestAnimationFrame ||
				// @ts-ignore
				window.oRequestAnimationFrame ||
				window.requestAnimationFrame ||
				function (/** @type {TimerHandler} */ callback) {
					window.setTimeout(callback, 1000 / 30);
				}
			);
		})();

		/**
		 * @param {number} starsCount
		 * @param {number} opacity
		 * @param {any[]} elements
		 * @param {string | any[]} sizes
		 * @param {number} canvas_width
		 * @param {number} canvas_height
		 * @param {any} context
		 */
		function generate(starsCount, opacity, elements, sizes, canvas_width, canvas_height, context) {
			for (var i = 0; i < starsCount; i++) {
				var x = randomInt(2, canvas_width - 2),
					y = randomInt(2, canvas_height - 2),
					size = sizes[randomInt(0, sizes.length - 1)];

				elements.push(star(x, y, size, opacity, context));
			}
		}

		/**
		 * @param {number} numberOfStarsToAnimate
		 * @param {any[]} elements
		 * @param {any} context
		 */
		function spark(numberOfStarsToAnimate, elements, context) {
			var max_brightness = 1,
				min_brightness = 0.2;
			for (var i = 0; i < numberOfStarsToAnimate; i++) {
				var id = randomInt(0, elements.length - 1),
					obj = elements[id],
					newAlpha = obj.alpha;
				do {
					newAlpha = randomFloatAround(obj.alpha);
				} while (newAlpha < min_brightness || newAlpha > max_brightness);

				elements[id] = star(obj.x, obj.y, obj.size, newAlpha, context);
			}

			// @ts-ignore
			window.requestAnimFrame(function () {
				spark(numberOfStarsToAnimate, elements, context);
			});
		}

		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {any} size
		 * @param {string | number} alpha
		 * @param {{ createRadialGradient: (arg0: any, arg1: any, arg2: number, arg3: any, arg4: any, arg5: number) => any; beginPath: () => void; clearRect: (arg0: number, arg1: number, arg2: number, arg3: number) => void; closePath: () => void; arc: (arg0: any, arg1: any, arg2: number, arg3: number, arg4: number) => void; fillStyle: any; fill: () => void; }} context
		 */
		function star(x, y, size, alpha, context) {
			var radius = 0;
			switch (size) {
				case 'micro':
					radius = 0.2;
					break;
				case 'mini':
					radius = 0.4;
					break;
				case 'medium':
					radius = 0.6;
					break;
				case 'big':
					radius = 0.8;
					break;
				case 'max':
					radius = 1.0;
					break;
			}

			var gradient = context.createRadialGradient(x, y, 0, x + radius, y + radius, radius * 2);
			gradient.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
			gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

			/* clearing background pixels */
			context.beginPath();
			context.clearRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
			context.closePath();

			/* drawing the star */
			context.beginPath();
			context.arc(x, y, radius, 0, 2 * Math.PI);
			context.fillStyle = gradient;
			context.fill();

			return {
				x: x,
				y: y,
				size: size,
				alpha: alpha,
			};
		}

		/**
		 * @param {number} a
		 * @param {number} b
		 */
		function randomInt(a, b) {
			return Math.floor(Math.random() * (b - a + 1) + a);
		}

		/**
		 * @param {any} num
		 */
		function randomFloatAround(num) {
			var plusminus = randomInt(0, 1000) % 2,
				val = num;
			if (plusminus) val += 0.1;
			else val -= 0.1;
			return parseFloat(val.toFixed(1));
		}

		if (!canvas) {
			console.log('NO CANVAS!');
			return false;
		}
		console.log('CANVAS');
		const canvasWidth = canvas.offsetWidth;
		const canvasHeight = canvas.offsetHeight;
		const starAmount = dynamic ? Math.round((canvasWidth * canvasHeight) / starDensity) : starDensity;
		const sparkAmount = Math.round(starAmount * (sparklingPercentage / 100));

		const context = canvas.getContext('2d');
		const sizes = ['micro', 'mini', 'medium', 'big', 'max'];
		/**
		 * @type {any[]}
		 */
		const elements = [];

		generate(starAmount, 0.5, elements, sizes, canvasWidth, canvasHeight, context);
		spark(sparkAmount, elements, context);
	};

	$: if (show === true) {
		showOrbitLoader();
	}
	$: if (show === false) {
		hideOrbitLoader();
	}

	onMount(() => {
		if (background === 'space') {
			createStarrySky(canvasElement);
		}
	});
</script>

<div
	class="orbit-loader-overlay"
	class:open={isOpen}
	class:opening={isOpening}
	class:closing={isClosing}
	class:closed={isClosed}
	class:bright-wormhole={backdrop === 'bright-wormhole'}
	class:dark-wormhole={backdrop === 'dark-wormhole'}
	class:dark-blackhole={backdrop === 'dark-blackhole'}
>
	<div
		class="orbit-loader"
		{title}
		class:bg-space={background === 'space'}
		class:bg-dark={background === 'dark'}
		class:wormhole={appearance === 'wormhole'}
		class:blackhole={appearance === 'blackhole'}
		class:flat={sphereStyle === '2d' || sphereStyle === 'flat'}
	>
		{#if background === 'space'}
			<div class="star-canvas-wrapper">
				<canvas class="star-canvas" width="128" height="128" bind:this={canvasElement} />
			</div>
		{/if}
		<div class="planet celestial-body" />
		<div class="moon1 celestial-body" />
		<div class="moon2 celestial-body" />
	</div>
</div>

<style>
	.star-canvas-wrapper {
		box-sizing: border-box;
		display: block;
		position: absolute;
		left: 1px;
		top: 1px;
		z-index: -1;
		width: 126px;
		height: 126px;
		border-radius: 52%;
		background-color: transparent;
		overflow: hidden;
	}
	.orbit-loader.bg-space.blackhole > .star-canvas-wrapper {
		left: 0;
		top: 0;
		border: 1px solid #000;
		width: 128px;
		height: 128px;
		background-color: #000;
	}
	.star-canvas {
		box-sizing: border-box;
		display: block;
		width: 126px;
		height: 126px;
		background-color: #000;
		border-radius: 52%;
	}
	.orbit-loader-overlay {
		background: rgba(255, 255, 255, 0.64);
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 2002;
		display: none;
		opacity: 0;
		/*cursor: wait;*/ /* <-- Uncomment if you want to emphasize that the page is currently blocked, but I would not recommend this. */
		transition: opacity 0.24s ease-out;
		-webkit-transition: opacity 0.24s ease-out;
	}
	.orbit-loader-overlay.bright-wormhole {
		background: rgba(255, 255, 255, 0.24);
	}
	.orbit-loader-overlay.dark-wormhole {
		background: rgba(0, 0, 0, 0.64);
	}
	.orbit-loader-overlay.dark-blackhole {
		background: rgba(0, 0, 0, 0.2);
	}
	.orbit-loader-overlay.opening {
		display: block;
		opacity: 0;
		transition: opacity 0.24s ease-out;
		-webkit-transition: opacity 0.24s ease-out;
	}
	.orbit-loader-overlay.closing {
		display: block;
		opacity: 0;
		transition: opacity 0.24s ease-out;
		-webkit-transition: opacity 0.24s ease-out;
	}
	.orbit-loader-overlay.open {
		display: block;
		opacity: 1;
		transition: opacity 0.24s ease-out;
		-webkit-transition: opacity 0.24s ease-out;
	}
	.orbit-loader-overlay.closed {
		display: none !important;
	}
	.orbit-loader {
		display: block;
		width: 128px;
		height: 128px;
		position: absolute;
		top: 50%;
		left: 50%;
		margin: -64px 0 0 -64px;
		text-align: center;
		background: #fff;
		border-radius: 52%;
		box-shadow: 0 0 256px 0 #fff, 0 0 128px 0 #fff, 0 0 64px 0 #fff, 0 0 32px 0 #fff, 0 0 16px 0 #fff;
		overflow: hidden;
		transition: all 0.24s ease-out;
		-webkit-transition: all 0.24s ease-out;
	}
	.opening > .orbit-loader,
	.closing > .orbit-loader {
		width: 0;
		height: 0;
		margin: -0px 0 0 -0px;
		box-shadow: 0 0 16px 0 #fff, 0 0 8px 0 #fff, 0 0 4px 0 #fff, 0 0 2px 0 #fff, 0 0 1px 0 #fff;
		transition: all 0.24s ease-out;
		-webkit-transition: all 0.24s ease-out;
	}
	.orbit-loader.bg-dark {
		background: #000;
	}
	.orbit-loader.bg-space {
		background: transparent;
	}
	.orbit-loader:not(.bg-space) > .star-canvas-wrapper {
		display: none;
	}
	.orbit-loader.wormhole {
		box-shadow: 0 0 256px 1px #fff, 0 0 128px 1px #fff, 0 0 64px 1px #fff, 0 0 32px 1px #fff, 0 0 16px 1px #fff,
			inset 0 0 2px 1px #fff, inset 0 0 4px 1px #fff, inset 0 0 8px 1px #fff, inset 0 0 12px 1px #fff, inset 0 0 16px 1px #fff;
	}
	.opening > .orbit-loader.wormhole,
	.closing > .orbit-loader.wormhole {
		box-shadow: 0 0 16px 0 #fff, 0 0 8px 0 #fff, 0 0 4px 0 #fff, 0 0 2px 0 #fff, 0 0 1px 0 #fff, inset 0 0 4px #fff,
			inset 0 0 8px #fff, inset 0 0 16px #fff;
	}
	.orbit-loader.blackhole {
		box-shadow: 0 0 256px 0 #000, 0 0 128px 0 #000, 0 0 64px 0 #000, 0 0 32px 0 #000, 0 0 16px 0 #000;
	}
	.opening > .orbit-loader.blackhole,
	.closing > .orbit-loader.blackhole {
		box-shadow: 0 0 16px 0 #000, 0 0 8px 0 #000, 0 0 4px 0 #000, 0 0 2px 0 #000, 0 0 1px 0 #000;
	}
	.orbit-loader > .planet {
		display: block;
		width: 40px;
		height: 40px;
		position: absolute;
		top: 50%;
		left: 50%;
		margin: -20px 0 0 -20px;
		border-radius: 52%;
		background-color: #08a;
		z-index: 1;
	}
	.orbit-loader > .moon1,
	.orbit-loader > .moon2 {
		display: block;
		position: absolute;
		top: 50%;
		left: 50%;
		width: 32px;
		height: 32px;
		margin: -16px 0 0 -16px;
		border-radius: 52%;
		background-color: #0a4;
		z-index: 0;

		-webkit-animation: orbit-one 2s infinite linear;
		animation: orbit-one 2s infinite linear;
	}

	.orbit-loader > .moon2 {
		background-color: #666;
		width: 16px;
		height: 16px;
		margin: -8px 0 0 -8px;

		-webkit-animation: orbit-two 1s infinite linear;
		animation: orbit-two 1s infinite linear;
	}

	.orbit-loader:not(.flat) > .celestial-body {
		box-shadow: inset 6.6% 0 26.6% 2% rgba(0, 0, 0, 1);
	}
	.orbit-loader:not(.flat) > .celestial-body:before {
		content: '';
		position: absolute;
		top: 0%;
		left: 0%;
		width: 100%;
		height: 100%;
		border-radius: 52%;
		box-shadow: -26.6% 5% 26.6% 3.3% rgba(0, 0, 0, 0.9) inset;
		z-index: 2;
	}
	.orbit-loader:not(.flat) > .celestial-body:after {
		content: '';
		position: absolute;
		border-radius: 52%;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		opacity: 0.2;
		background: radial-gradient(circle at 33% 33%, #fff, #000);
		z-index: 1;
	}

	@-webkit-keyframes rotation {
		100% {
			-webkit-transform: rotate(360deg);
		}
	}
	@keyframes rotation {
		100% {
			transform: rotate(360deg);
			-webkit-transform: rotate(360deg);
		}
	}

	@-webkit-keyframes orbit-one {
		0%,
		100% {
			-webkit-transform: scale(0.25) translateX(0px) translateY(0px);
			z-index: 0;
		}
		25% {
			-webkit-transform: scale(0.5) translateX(64px) translateY(-32px);
			z-index: 0;
		}
		50% {
			-webkit-transform: scale(1) translateX(0px) translateY(0px);
			z-index: 1;
		}
		75% {
			-webkit-transform: scale(0.5) translateX(-64px) translateY(32px);
			z-index: 0;
		}
	}

	@keyframes orbit-one {
		0%,
		100% {
			transform: scale(0.25) translateX(-8px) translateY(-8px);
			-webkit-transform: scale(0.25) translateX(-8px) translateY(-8px);
			z-index: 0;
		}
		25% {
			transform: scale(0.5) translateX(64px) translateY(-32px);
			-webkit-transform: scale(0.5) translateX(64px) translateY(-32px);
			z-index: 0;
		}
		50% {
			transform: scale(1) translateX(8px) translateY(8px);
			-webkit-transform: scale(1) translateX(8px) translateY(8px);
			z-index: 2;
		}
		75% {
			transform: scale(0.5) translateX(-64px) translateY(32px);
			-webkit-transform: scale(0.5) translateX(-64px) translateY(32px);
			z-index: 0;
		}
	}

	@-webkit-keyframes orbit-two {
		0%,
		100% {
			-webkit-transform: scale(0.5) translateX(0px) translateY(0px);
			z-index: 0;
		}
		25% {
			-webkit-transform: scale(0.75) translateX(-48px) translateY(-2px);
			z-index: 0;
		}
		50% {
			-webkit-transform: scale(1) translateX(0px) translateY(0px);
			z-index: 1;
		}
		75% {
			-webkit-transform: scale(0.75) translateX(48px) translateY(32px);
			z-index: 0;
		}
	}

	@keyframes orbit-two {
		0%,
		100% {
			transform: scale(0.5) translateX(-8px) translateY(-8px);
			-webkit-transform: scale(0.5) translateX(-8px) translateY(-8px);
			z-index: 0;
		}
		25% {
			transform: scale(0.75) translateX(-48px) translateY(-32px);
			-webkit-transform: scale(0.75) translateX(-48px) translateY(-32px);
			z-index: 0;
		}
		50% {
			transform: scale(1) translateX(8px) translateY(8px);
			-webkit-transform: scale(1) translateX(8px) translateY(8px);
			z-index: 1;
		}
		75% {
			transform: scale(0.75) translateX(48px) translateY(32px);
			-webkit-transform: scale(0.75) translateX(48px) translateY(32px);
			z-index: 0;
		}
	}
</style>
