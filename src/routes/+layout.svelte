<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeToggler from '$lib/components/ThemeToggler.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<script>
		document.documentElement.classList.add(
			localStorage.getItem('app:theme') ??
				(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		);
	</script>
	<link rel="icon" href={favicon} />
</svelte:head>
<div class="theme">
	<ThemeToggler />
</div>
{@render children()}

<style>
	.theme {
		position: absolute;
		right: 1rem;
	}
</style>