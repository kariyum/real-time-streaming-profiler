<script lang="ts">
	import { page } from '$app/state';
	import Dashboards from '$lib/components/Dashboards.svelte';
	import TableWithMinMax from '$lib/components/TableWithMinMax.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { onMount } from 'svelte';
	let dashboards: DashboardEntity[] = [];
	let linkData: string | null = null;

	onMount(async () => {
		const db = (await Database.getInstance()).db;
		dashboards = db ? await dashboardsRepo.getAllDashboards(db) : [];
		linkData = page.url.searchParams.get('data');
	});
</script>

{#if typeof linkData == 'string'}
	<TableWithMinMax data={linkData}></TableWithMinMax>
{:else}
	<Dashboards {dashboards}></Dashboards>
{/if}
