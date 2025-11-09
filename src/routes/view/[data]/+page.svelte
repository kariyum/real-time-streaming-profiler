<script lang="ts">
	import { page } from '$app/state';
	import Table from '$lib/components/Table.svelte';
	import { type EnhancedMetric } from '$lib/types';
	import { base64UrlDecode } from '$lib/utils';
	import { onMount } from 'svelte';

	let data: Array<EnhancedMetric> = $state([]);
	onMount(() => {
		const urlData = page.params.data;
		if (urlData) {
			data = base64UrlDecode<Array<EnhancedMetric>>(urlData);
		}
	});
	let globalMax: number = $derived.by(() => {
		return Math.max(...data.map((a) => a.cpu_time));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...data.map((a) => a.cpu_time));
	});
</script>

<Table {data} max={globalMax} min={globalMin} />
