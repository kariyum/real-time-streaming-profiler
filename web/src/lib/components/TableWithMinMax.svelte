<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import { dashboardsRepo, Database } from '$lib/db';
	import { type EnhancedMetric } from '$lib/types';
	import { base64UrlDecode } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data }: { data: string } = $props();
	let database: Database;

	onMount(async () => {
		database = await Database.getInstance();
		if (database.db) {
			dashboardsRepo.getById(database.db, parseInt(data)).then((value) => {
				metrics = value.entity.metrics;
			});
		}
	});
	let metrics: Array<EnhancedMetric> = $state([]);

	let globalMax: number = $derived.by(() => {
		return Math.max(...metrics.map((a) => a.cpu_time));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...metrics.map((a) => a.cpu_time));
	});
</script>

<Table data={metrics} max={globalMax} min={globalMin} />
