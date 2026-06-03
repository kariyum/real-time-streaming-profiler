<script lang="ts">
	import { copy } from '$lib/utils';

	let {
		text,
		beforeCopyText,
		afterCopyText = 'Copied!'
	}: { text: string; beforeCopyText: string; afterCopyText?: string } = $props();

	let buttonText = $derived(beforeCopyText);

	function clickHandler() {
		copy(text);
		buttonText = afterCopyText;
		setTimeout(() => (buttonText = beforeCopyText), 2000);
	}
</script>

<button onclick={() => clickHandler()}>{buttonText}</button>
