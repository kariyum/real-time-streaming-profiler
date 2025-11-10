<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { onMount } from 'svelte';
	let dashboards: DashboardEntity[] = $state([]);
	let linkData: string | null = $state(null);

	onMount(async () => {
		const db = (await Database.getInstance()).db;
		dashboards = db ? await dashboardsRepo.getAllDashboards(db) : [];
	});

	$effect.pre(() => {
		linkData = page.url.searchParams.get('data');
	});
</script>

{#if typeof linkData == 'string'}
	<TableWithMinMax data={linkData}></TableWithMinMax>
{:else}
	<Dashboards></Dashboards>
{/if}
