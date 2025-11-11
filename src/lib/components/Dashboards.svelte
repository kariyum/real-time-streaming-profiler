<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	let database: Database;
	let dashboards: DashboardEntityFirestore[] = $state([]);

	onMount(async () => {
		database = await Database.getInstance();
		dashboards = database.db ? await dashboardsRepo.getAllDashboards(database.db) : [];
	});

	async function deleteDashboard(id: number): Promise<void> {
		if (database && database.db) {
			await dashboardsRepo.deleteDashboard(database.db, id);
			const newDashboards = await dashboardsRepo.getAllDashboards(database.db);
			dashboards = newDashboards;
			return Promise.resolve();
		}
		return Promise.reject('NO DB');
	}

	async function uploadDashboard(dashboard: DashboardEntityFirestore) {
		const firebaseId = await dashboardsRepoFirebase.add(dashboard.entity);
		const newEntity = {
			entity: dashboard.entity,
			id: dashboard.id,
			firebaseId: firebaseId
		};
		if (database.db && dashboard.id) {
			await dashboardsRepo.updateDashboard(database.db, newEntity);
			const newDashboards = await dashboardsRepo.getAllDashboards(database.db);
			dashboards = newDashboards;
		}
	}
</script>

<a href={base + '/'} aria-label="home"
	><svg
		xmlns="http://www.w3.org/2000/svg"
		width="50"
		height="50"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-move-left-icon lucide-move-left"
		><path d="M6 8L2 12L6 16" /><path d="M2 12H22" /></svg
	></a
>
{#if dashboards.length == 0}
	<div>No saved dashboards yet!</div>
{:else}
	<div class="dashboards">
		{#each dashboards as dashboard}
			<Dashboard {dashboard} {deleteDashboard} {uploadDashboard}></Dashboard>
		{/each}
	</div>
{/if}

<style>
	.dashboards {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		row-gap: 1rem;
		column-gap: 1rem;
	}

	a {
		text-decoration: none;
		color: var(--font-color);
		font-size: large;
	}
</style>
