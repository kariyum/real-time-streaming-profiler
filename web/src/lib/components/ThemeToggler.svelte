<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	function getTheme() {
		if (browser) {
			return (
				localStorage.getItem('app:theme') ??
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
			);
		}
		return 'light';
	}

	let theme: string | undefined = $state();

	const toggleTheme = () => {
		if (theme) {
			document.documentElement.classList.remove(theme);
			theme = theme === 'light' ? 'dark' : 'light';
			document.documentElement.classList.add(theme);
			localStorage.setItem('app:theme', theme);
		}
	};

	onMount(() => {
		theme = getTheme();
		document.documentElement.classList.add(theme);
	});
</script>

<svelte:head>
	<meta name="color-scheme" content={theme} />
</svelte:head>

<button onclick={toggleTheme} aria-label="Toggle dark mode" aria-pressed={theme === 'dark'}>
	<div class="icon-container" class:is-dark={theme === 'dark'}>
		<svg
			class="sun-icon"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>

		<svg
			class="moon-icon"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	</div>
</button>

<style>
	button {
		background-color: transparent;
		border: 1px solid var(--panel-border);
		margin: 0;
		padding: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		overflow: hidden;

		&:hover {
			background-color: var(--table-hover);
			border-color: var(--btn-border);
		}
	}

	.icon-container {
		position: relative;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		position: absolute;
		width: 1.25rem;
		height: 1.25rem;
		transition:
			transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s ease;
	}

	/* Light mode defaults: show Sun, hide Moon */
	.sun-icon {
		opacity: 1;
		transform: rotate(0deg) scale(1);
		color: #eab308;
	}

	.moon-icon {
		opacity: 0;
		transform: rotate(90deg) scale(0.6);
		color: #cbd5e1;
	}

	/* Dark mode: show Moon, hide Sun */
	.is-dark {
		.sun-icon {
			opacity: 0;
			transform: rotate(-90deg) scale(0.6);
		}

		.moon-icon {
			opacity: 1;
			transform: rotate(0deg) scale(1);
			color: #a5b4fc;
		}
	}
</style>
