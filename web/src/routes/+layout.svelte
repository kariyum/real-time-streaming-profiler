<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import ThemeToggler from '$lib/components/ThemeToggler.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ControlPanel from '$lib/components/ControlPanel.svelte';

	let { children } = $props();

	let currentPath = $derived(page.url.pathname);
</script>

<svelte:head>
	<script>
		document.documentElement.classList.add(
			localStorage.getItem('app:theme') ??
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		);
	</script>
	<link rel="icon" href={favicon} />
	<title>Remote Profiler</title>
</svelte:head>

<div class="app-layout">
	<header class="app-header">
		<div class="header-container">
			<ControlPanel></ControlPanel>

			<nav class="nav-links">
				<a
					href={resolve('/')}
					class="nav-link"
					class:active={currentPath === resolve('/') || currentPath === '/'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="nav-icon"
					>
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					Feeder Stream
				</a>
				<a
					href={resolve('/view')}
					class="nav-link"
					class:active={currentPath.includes('/view') || currentPath.includes('/share')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="nav-icon"
					>
						<rect width="18" height="18" x="3" y="3" rx="2" />
						<path d="M15 3v18" />
						<path d="m8 9 3 3-3 3" />
					</svg>
					Feeders History
				</a>
			</nav>

			<div class="header-actions">
				<ThemeToggler />
			</div>
		</div>
	</header>

	<main class="container main-content">
		{@render children()}
	</main>
</div>

<style>
	.app-layout {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.app-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background-color: var(--header-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--header-border);
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal);
	}

	.header-container {
		margin: 0 auto;
		padding: 0 1.5rem;
		height: 4.5rem;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--font-color);
		transition: transform var(--transition-fast);

		&:hover {
			transform: translateY(-1px);
		}
	}

	.logo-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		background: linear-gradient(135deg, var(--primary), #818cf8);
		border-radius: var(--radius-sm);
		color: #ffffff;
		box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
	}

	.logo-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.nav-links {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin: auto;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--font-secondary);
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition:
			color var(--transition-fast),
			background-color var(--transition-fast);

		&:hover {
			color: var(--font-color);
			background-color: var(--table-hover);
		}

		&.active {
			color: var(--primary);
			background-color: var(--primary-soft);
		}
	}

	.nav-icon {
		opacity: 0.8;
	}

	.header-actions {
		display: flex;
		justify-content: end;
		align-items: flex-end;
	}

	.main-content {
		flex: 1 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	@media (max-width: 640px) {
		.header-container {
			height: auto;
			padding: 1rem;
			flex-direction: column;
			gap: 1rem;
		}
		.nav-links {
			width: 100%;
			justify-content: center;
		}
		.header-actions {
			display: none;
		}
	}
</style>
