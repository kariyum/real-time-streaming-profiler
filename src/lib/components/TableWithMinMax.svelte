<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import { type EnhancedMetric } from '$lib/types';
	import { base64UrlDecode } from '$lib/utils';

	let { data }: { data: string } = $props();
	let metrics: Array<EnhancedMetric> = $derived.by(() => {
		return base64UrlDecode<Array<EnhancedMetric>>(data);
	});
	let globalMax: number = $derived.by(() => {
		return Math.max(...metrics.map((a) => a.cpu_time));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...metrics.map((a) => a.cpu_time));
	});
</script>

<Table data={metrics} max={globalMax} min={globalMin} />
