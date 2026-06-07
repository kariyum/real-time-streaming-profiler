<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import Table from '$lib/components/Table.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import type { EnhancedMetric } from '$lib/types';
	import { untrack } from 'svelte';
	let id: string | null = $state(null);
	let metrics: Array<EnhancedMetric> = $state([]);
	let isLoading = $state(false);
	let errorMessage: string | undefined = $state(undefined);

	$effect.pre(() => {
		id = page.url.searchParams.get('id');
		untrack(() => {
			if (id) {
				isLoading = true;
				dashboardsRepoFirebase.readById(id).then((firebaseData) => {
					isLoading = false;
					if (firebaseData) {
						metrics = firebaseData.metrics;
						errorMessage = undefined;
					} else {
						errorMessage = 'Metrics does not exist';
					}
				});
			}
		});
	});

	let globalMax: number = $derived.by(() => {
		return Math.max(...metrics.map((a) => a.cpuTime));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...metrics.map((a) => a.cpuTime));
	});
</script>

{#if id}
	{#if isLoading}
		<div>Fetching metrics...</div>
	{:else if errorMessage}
		<div>{errorMessage}</div>
	{:else}
		<Table data={metrics} max={globalMax} min={globalMin} />
	{/if}
{/if}
