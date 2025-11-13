<script lang="ts">
	import type { Snippet } from 'svelte';

	let waitingForResponse = $state(false);
	let isLoading = $state(false);
	let disabled = $derived(waitingForResponse);
	let done = $state(false);

	interface Props {
		onclick: (event: MouseEvent) => Promise<any>;
		idleView: Snippet;
		endView: Snippet;
	}

	let { onclick, idleView, endView }: Props = $props();

	async function clickHandler(event: MouseEvent) {
		waitingForResponse = true;
		const spinnerTimeout = setTimeout(() => (isLoading = true), 200);
		await onclick(event);
		clearTimeout(spinnerTimeout);
		waitingForResponse = false;
		done = true;
		setTimeout(() => (done = false), 1000);
	}
</script>

<button {disabled} onclick={clickHandler}>
	{#if isLoading}
		<span class="loader"></span>
	{:else if done}
		{@render endView()}
	{:else}
		{@render idleView()}
	{/if}
</button>

<style>
	.loader {
		width: 0.9rem;
		height: 0.9rem;
		border: 5px dotted var(--font-color);
		display: inline-block;
		position: relative;
		box-sizing: border-box;
		animation: rotation 1.5s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
