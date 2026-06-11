<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import ThemeToggler from '$lib/components/ThemeToggler.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import { eventStreamState } from '$lib/eventSource.svelte';
	import { History, Play } from '@lucide/svelte';
	import { onNavigate } from '$app/navigation';

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

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
					<Play size="14" />
					Feeder Stream
				</a>
				<a
					href={resolve('/view')}
					class="nav-link"
					class:active={currentPath.includes('/view') || currentPath.includes('/share')}
				>
					<History size="14" />
					Feeders History
				</a>
			</nav>

			<div class="header-actions">
				<ThemeToggler />
			</div>
		</div>
	</header>

	<div class="feeders-list">
		{#if eventStreamState.onlineFeeders.length > 0}
			Online Feeders:
			{#each eventStreamState.onlineFeeders as feeder}
				<span class="feeder-tag">{feeder.name}</span>
			{/each}
		{:else if eventStreamState.connected === 'open'}
			NO FEEDER :/
		{/if}
	</div>

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
		view-transition-name: header;
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

	.feeders-list {
		display: flex;
		gap: 0.35rem;
		margin: 0.5rem 1.5rem;
		font-family: 'JetBrains Mono', monospace;
		view-transition-name: feeders-list;
	}

	.feeder-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: var(--radius-sm);
		background-color: var(--primary-soft);
		color: var(--primary);
		border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes slide-from-right {
		from {
			transform: translateX(30px);
		}
	}

	@keyframes slide-to-left {
		to {
			transform: translateX(-30px);
		}
	}
	:root::view-transition-old(root) {
		animation:
			90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
	}

	:root::view-transition-new(root) {
		animation:
			210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
	}
</style>
