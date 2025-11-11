<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import Table from '$lib/components/Table.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import type { EnhancedMetric } from '$lib/types';
	let id: string | null = $state(null);
	let metrics: Array<EnhancedMetric> = $state([]);
	$effect.pre(() => {
		id = page.url.searchParams.get('id');
		if (id) {
			dashboardsRepoFirebase.readById(id).then((firebaseData) => {
				if (firebaseData) {
					metrics = firebaseData.metrics;
				}
			});
		}
	});

	let globalMax: number = $derived.by(() => {
		return Math.max(...metrics.map((a) => a.cpu_time));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...metrics.map((a) => a.cpu_time));
	});
</script>

{#if id}
	<Table data={metrics} max={globalMax} min={globalMin} />
{:else}
	<Dashboards></Dashboards>
{/if}
