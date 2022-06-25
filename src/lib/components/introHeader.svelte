<script>
	import { onMount } from 'svelte';

	export let playOnMount = true;
	export let playLooped = false;
	export let replayOnClick = true;

	let introStep = 0;
	let animSpeedMs = 750;

	let introFinished = playOnMount ? false : true;

	const playIntroAnim = () => {
		introStep = 0;
		introFinished = false;
		setTimeout(() => {
			introStep = 1;
			setTimeout(() => {
				introStep = 2;
				setTimeout(() => {
					introStep = 3;
					setTimeout(() => {
						introStep = 4;
						setTimeout(() => {
							introStep = 5;
							setTimeout(() => {
								introStep = 6;
								setTimeout(() => {
									introStep = 7;
									setTimeout(() => {
										introStep = 8;
										setTimeout(() => {
											introFinished = true;
											introStep = 0;
											if (playLooped) {
												setTimeout(() => {
													playIntroAnim();
												}, 5000);
											}
										}, animSpeedMs * 2);
									}, animSpeedMs);
								}, animSpeedMs);
							}, animSpeedMs);
						}, animSpeedMs);
					}, animSpeedMs * 2);
				}, animSpeedMs);
			}, animSpeedMs);
		}, animSpeedMs * 3);
	};

	const replayIntro = () => {
		if (replayOnClick && introFinished) {
			introStep = 8;
			introFinished = false;
			setTimeout(() => {
				introStep = 0;
				playIntroAnim();
			}, animSpeedMs * 2);
		}
	};

	onMount(() => {
		document && document.documentElement.style.setProperty('--intro-anim-speed', animSpeedMs + 'ms');
		if (playOnMount) {
			playIntroAnim();
		}
	});
</script>

<header class="page-header" class:intro-mode={!introFinished}>
	<div class="header-inner">
		<div
			class="intro"
			class:cursor-pointer={replayOnClick && introFinished}
			class:step1={introStep === 1}
			class:step2={introStep === 2}
			class:step3={introStep === 3}
			class:step4={introStep === 4}
			class:step5={introStep === 5}
			class:step6={introStep === 6}
			class:step7={introStep === 7}
			class:step8={introStep === 8}
			on:click={replayIntro}
		>
			<span class="date">24.09.</span>
			<span class="twenty">20</span><span class="operator" /><span class="twenty-two">22</span>
			<span class="forty-two"><span class="four">4</span><span class="two">2</span></span>
			<span class="twenty-four"><span class="two">2</span><span class="four">4</span></span>
		</div>
		<h1 class="site-title text-center text-xl font-extrabold sm:text-3xl">Einladung zum 42sten am 24sten</h1>
	</div>
</header>

<style global>
	.page-header {
		display: flex;
		width: 100%;
		height: 4.5rem;
		background-color: rgba(255, 255, 255, 1);
		transition: height var(--intro-anim-speed, 500ms) ease-in-out, background-color var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode {
		display: block;
		width: 100vw;
		height: 100vh;
		background-color: rgba(255, 255, 255, 0);
	}
	.page-header.intro-mode ~ main,
	.page-header.intro-mode ~ footer {
		display: block;
		overflow: hidden;
		min-height: 0 !important;
		height: 0 !important;
		padding: 0 !important;
	}
	.page-header > .header-inner {
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		margin: 0 auto;
		width: 100%;
		height: 4.5rem;
		max-width: 72rem;
		padding: 0.375rem 1rem;
		transition: all var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner {
		width: 100%;
		max-width: 100%;
		height: 100vh;
		max-width: 100%;
		padding: 0;
	}

	.page-header > .header-inner > .site-title {
		display: block;
		overflow: hidden;
		padding-left: 1.5rem;
		opacity: 1;
		max-width: 34rem;
		transform-origin: center center;
		transform: scale(1);
		transition: max-width var(--intro-anim-speed, 500ms) ease-in-out, transform var(--intro-anim-speed, 500ms) ease-in-out,
			opacity var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner > .site-title {
		opacity: 0;
		max-width: 0;
		transform: scale(0);
	}
	.header-inner > .intro {
		display: block;
		position: relative;
		font-weight: 700;
		font-size: 0.0625rem;
		line-height: 30em;
		width: 60em;
		height: 60em;
		min-width: 60em;
		min-height: 60em;
		background-color: #08a;
		background: -moz-linear-gradient(top, #08a 0%, #08a 50%, #0a4 50%, #0a4 100%);
		background: -webkit-linear-gradient(top, #08a 0%, #08a 50%, #0a4 50%, #0a4 100%);
		background: linear-gradient(to bottom, #08a 0%, #08a 50%, #0a4 50%, #0a4 100%);
		text-align: center;
		color: #fff;
		overflow: hidden;
		transition: all var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner > .intro {
		font-size: 0.625rem;
	}
	@media screen and (max-width: 767px) {
		.page-header.intro-mode > .header-inner > .intro {
			font-size: 0.3125rem;
		}
	}
	.page-header.intro-mode > .header-inner > .intro .operator {
		display: inline-block;
		opacity: 1;
		width: 8em;
		height: 30em;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%) scale(0);
		transition: transform var(--intro-anim-speed, 500ms) ease-in-out, opacity var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner > .intro .operator:before {
		content: '';
		display: block;
		height: 8em;
		width: 2em;
		background-color: #fff;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translateY(-50%) translateX(-50%);
		transition: transform var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner > .intro .operator:after {
		content: '';
		display: block;
		height: 2em;
		width: 8em;
		background-color: #fff;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translateY(-50%) translateX(-50%);
		transition: transform var(--intro-anim-speed, 500ms) ease-in-out;
	}

	.page-header.intro-mode > .header-inner > .intro > .twenty,
	.page-header.intro-mode > .header-inner > .intro > .twenty-two {
		display: block;
		opacity: 1;
		overflow: hidden;
		font-size: 10em;
		line-height: 3em;
		position: absolute;
		padding-bottom: 0;
		transition: all var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header.intro-mode > .header-inner > .intro > .twenty {
		top: 0;
		left: 3.375em;
	}
	.page-header.intro-mode > .header-inner > .intro > .twenty-two {
		top: 0;
		left: 4.5em;
	}
	.page-header.intro-mode > .header-inner > .intro > .date {
		display: block;
		opacity: 1;
		overflow: hidden;
		font-size: 10em;
		line-height: 3em;
		position: absolute;
		top: 0;
		left: 0.375em;
		transition: opacity var(--intro-anim-speed, 500ms) ease-in-out, left var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header > .header-inner > .intro > .twenty-four,
	.page-header > .header-inner > .intro > .forty-two {
		display: block;
		opacity: 0;
		overflow: hidden;
		font-size: 30em;
		line-height: 0.875em;
		width: 1.15em;
		height: 1em;
		padding-bottom: 0.125em;
		position: absolute;
		top: 0;
		left: 0.42em;
		transform-origin: center center;
		transform: scale(0);
		transition: opacity var(--intro-anim-speed, 500ms) ease-in-out, top var(--intro-anim-speed, 500ms) ease-in-out,
			left var(--intro-anim-speed, 500ms) ease-in-out, transform var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header > .header-inner > .intro > .twenty-four > .two,
	.page-header > .header-inner > .intro > .twenty-four > .four {
		display: block;
		overflow: hidden;
		font-size: 1em;
		line-height: 0.875em;
		width: 0.575em;
		padding-bottom: 0.125em;
		position: absolute;
		top: 0;
		transition: left var(--intro-anim-speed, 500ms) ease-in-out;
	}
	.page-header > .header-inner > .intro > .twenty-four > .two {
		left: 0;
	}
	.page-header > .header-inner > .intro > .twenty-four > .four {
		left: 0.575em;
	}
	.page-header.intro-mode > .header-inner > .intro.step1 > .twenty-four > .two,
	.page-header.intro-mode > .header-inner > .intro.step2 > .twenty-four > .two,
	.page-header.intro-mode > .header-inner > .intro.step3 > .twenty-four > .two,
	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty-four > .two,
	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty-four > .two,
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty-four > .two {
		left: 0.575em;
	}
	.page-header.intro-mode > .header-inner > .intro.step1 > .twenty-four > .four,
	.page-header.intro-mode > .header-inner > .intro.step2 > .twenty-four > .four,
	.page-header.intro-mode > .header-inner > .intro.step3 > .twenty-four > .four,
	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty-four > .four,
	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty-four > .four,
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty-four > .four {
		left: 0;
	}

	.page-header.intro-mode > .header-inner > .intro.step1 > .date,
	.page-header.intro-mode > .header-inner > .intro.step2 > .date {
		opacity: 0.5;
		left: -4em;
	}
	.header-inner:not(.intro-mode) > .intro > .date,
	.page-header.intro-mode > .header-inner > .intro.step2 > .date,
	.page-header.intro-mode > .header-inner > .intro.step3 > .date,
	.page-header.intro-mode > .header-inner > .intro.step4 > .date,
	.page-header.intro-mode > .header-inner > .intro.step5 > .date,
	.page-header.intro-mode > .header-inner > .intro.step6 > .date,
	.page-header.intro-mode > .header-inner > .intro.step7 > .date,
	.page-header.intro-mode > .header-inner > .intro.step8 > .date {
		display: none;
	}
	.page-header.intro-mode > .header-inner > .intro.step2 > .twenty {
		opacity: 1;
		width: 1.15em;
		font-size: 20em;
		line-height: 1.375em;
		padding-bottom: 0.125em;
		top: 0;
		left: 0.35em;
	}
	.page-header.intro-mode > .header-inner > .intro.step2 > .twenty-two {
		opacity: 1;
		width: 1.15em;
		font-size: 20em;
		line-height: 1.375em;
		padding-bottom: 0.125em;
		top: 0;
		left: 1.5em;
	}
	.page-header.intro-mode > .header-inner > .intro.step3 > .twenty,
	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty {
		opacity: 1;
		width: 1.15em;
		font-size: 20em;
		line-height: 1.375em;
		padding-bottom: 0.125em;
		top: 0;
		left: 0.125em;
	}
	.page-header.intro-mode > .header-inner > .intro.step3 > .twenty-two,
	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty-two {
		opacity: 1;
		width: 1.15em;
		font-size: 20em;
		line-height: 1.375em;
		padding-bottom: 0.125em;
		top: 0;
		left: 1.75em;
	}

	.page-header.intro-mode > .header-inner > .intro.step3 .operator,
	.page-header.intro-mode > .header-inner > .intro.step4 .operator {
		transform: translateX(-42%) scale(1);
	}
	.page-header.intro-mode > .header-inner > .intro.step4 .operator:before,
	.page-header.intro-mode > .header-inner > .intro.step5 .operator:before,
	.page-header.intro-mode > .header-inner > .intro.step6 .operator:before,
	.page-header.intro-mode > .header-inner > .intro.step7 .operator:before,
	.page-header.intro-mode > .header-inner > .intro.step8 .operator:before {
		transform: translateY(-10%) translateX(-50%) rotate(270deg);
	}
	.page-header.intro-mode > .header-inner > .intro.step4 .operator:after,
	.page-header.intro-mode > .header-inner > .intro.step5 .operator:after,
	.page-header.intro-mode > .header-inner > .intro.step6 .operator:after,
	.page-header.intro-mode > .header-inner > .intro.step7 .operator:after,
	.page-header.intro-mode > .header-inner > .intro.step8 .operator:after {
		transform: translateY(-90%) translateX(-50%) rotate(180deg);
	}
	.page-header.intro-mode > .header-inner > .intro.step5 .operator,
	.page-header.intro-mode > .header-inner > .intro.step6 .operator {
		opacity: 0;
		transform: translateX(-42%) translateY(-7%) scale(2);
	}
	.page-header.intro-mode > .header-inner > .intro.step6 .operator,
	.page-header.intro-mode > .header-inner > .intro.step7 .operator,
	.page-header.intro-mode > .header-inner > .intro.step8 .operator {
		display: none;
	}

	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty,
	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty {
		opacity: 0;
		width: 1.15em;
		font-size: 30em;
		line-height: 0.875em;
		padding-bottom: 0.125em;
		top: 0;
		left: 0.42em;
	}
	.page-header.intro-mode > .header-inner > .intro.step4 > .twenty-two,
	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty-two {
		opacity: 0;
		width: 1.15em;
		font-size: 30em;
		line-height: 0.875em;
		padding-bottom: 0.125em;
		top: 0;
		left: 0.42em;
	}

	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty,
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty,
	.page-header.intro-mode > .header-inner > .intro.step7 > .twenty,
	.page-header.intro-mode > .header-inner > .intro.step8 > .twenty {
		display: none;
	}
	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty-two,
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty-two,
	.page-header.intro-mode > .header-inner > .intro.step7 > .twenty-two,
	.page-header.intro-mode > .header-inner > .intro.step8 > .twenty-two {
		display: none;
	}
	.page-header.intro-mode > .header-inner > .intro.step5 > .forty-two,
	.page-header.intro-mode > .header-inner > .intro.step6 > .forty-two,
	.page-header.intro-mode > .header-inner > .intro.step7 > .forty-two {
		opacity: 1;
		transform: scale(1);
		left: 0.42em;
	}
	.page-header.intro-mode > .header-inner > .intro.step8 > .forty-two {
		opacity: 1;
		transform: scale(1);
		left: 0.15em;
	}

	.page-header.intro-mode > .header-inner > .intro.step5 > .twenty-four,
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty-four,
	.page-header.intro-mode > .header-inner > .intro.step7 > .twenty-four,
	.page-header.intro-mode > .header-inner > .intro.step8 > .twenty-four {
		opacity: 1;
		transform: scale(1);
		left: 0.42em;
	}
	.page-header.intro-mode > .header-inner > .intro.step6 > .twenty-four,
	.page-header.intro-mode > .header-inner > .intro.step7 > .twenty-four {
		top: 1em;
	}
	.page-header.intro-mode > .header-inner > .intro.step8 > .twenty-four {
		top: 1em;
		left: 0.725em;
	}
	.page-header:not(.intro-mode) > .header-inner > .intro .operator,
	.page-header:not(.intro-mode) > .header-inner > .intro > .twenty,
	.page-header:not(.intro-mode) > .header-inner > .intro > .twenty-two {
		display: none;
	}
	.page-header.intro-mode
		> .header-inner
		> .intro
		> .date
		.page-header:not(.intro-mode)
		> .header-inner
		> .intro.step8
		> .forty-two,
	.page-header:not(.intro-mode) > .header-inner > .intro > .forty-two {
		opacity: 1;
		transform: scale(1);
		left: 0.15em;
	}
	.page-header:not(.intro-mode) > .header-inner > .intro.step8 > .twenty-four,
	.page-header:not(.intro-mode) > .header-inner > .intro > .twenty-four {
		opacity: 1;
		transform: scale(1);
		top: 1em;
		left: 0.725em;
	}
</style>
