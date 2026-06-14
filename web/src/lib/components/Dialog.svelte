<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		dialogBody,
		button
	}: {
		dialogBody: Snippet<[onClose: () => void, onSubmit: () => void]>;
		button: Snippet<[onOpen: () => void]>;
	} = $props();

	let dialog: HTMLDialogElement;

	const onClose = () => dialog.close();
	const onSubmit = () => dialog.close();
	const onOpen = () => dialog.showModal();
</script>

{@render button(onOpen)}

<!-- <dialog bind:this={dialog}> -->
{@render dialogBody(onClose, onSubmit)}

<!-- </dialog> -->

<style>
	dialog {
		padding: 0rem;
		border: none;
		width: fit-content;
		inset: 0;
		border-radius: 15px;
		opacity: 1;
		transition-behavior: allow-discrete;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (width < 600px) {
	}

	dialog[open] {
		opacity: 1;
		transition: opacity 0.2s;
	}

	@starting-style {
		dialog[open] {
			opacity: 0;
		}
	}
</style>
