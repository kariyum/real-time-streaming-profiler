<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { base, resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';

	let database: Database;
	let dashboards: DashboardEntityFirestore[] = $state([]);
	let isLoading = $state(true);

	onMount(async () => {
		isLoading = true;
		database = await Database.getInstance();
		dashboards = database.db ? await dashboardsRepo.getAllDashboards(database.db) : [];
		isLoading = false;
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

	async function uploadDashboard(dashboard: DashboardEntityFirestore): Promise<void> {
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

<div class="dashboards-container animate-fade-in">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Retrieving local dashboards...</p>
		</div>
	{:else if dashboards.length == 0}
		<div class="empty-state panel-card">
			<div class="empty-icon-wrapper">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					class="empty-icon"
				>
					<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
					<path d="M6 6h10" />
					<path d="M6 10h10" />
				</svg>
			</div>
			<h3>No Saved Profiles</h3>
			<p>Run the live stream profiler and save snapshots to list them here.</p>
			<a href={resolve('/')} class="btn-primary-link">Return to Live Stream</a>
		</div>
	{:else}
		<div class="dashboards-grid">
			{#each dashboards as dashboard}
				<Dashboard {dashboard} {deleteDashboard} {uploadDashboard}></Dashboard>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dashboards-container {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		margin-top: 1rem;
	}

	.page-header {
		margin-bottom: 0.5rem;
	}

	.page-title {
		font-size: 1.875rem;
		margin-bottom: 0.25rem;
		background: linear-gradient(to right, var(--font-color), var(--font-secondary));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: var(--font-secondary);
		margin: 0;
	}

	/* Dashboards Grid Layout */
	.dashboards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	/* Loading & Empty State styles */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6rem 2rem;
		color: var(--font-secondary);
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid var(--panel-border);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		background-color: var(--panel-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--panel-shadow);
		padding: 4rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;

		h3 {
			font-size: 1.25rem;
			margin: 1rem 0 0.5rem 0;
		}

		p {
			max-width: 400px;
			margin: 0 0 1.5rem 0;
			font-size: 0.875rem;
			color: var(--font-muted);
		}
	}

	.empty-icon-wrapper {
		width: 4rem;
		height: 4rem;
		background-color: var(--table-header);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--font-muted);
	}

	.empty-icon {
		width: 2rem;
		height: 2rem;
	}

	.btn-primary-link {
		display: inline-flex;
		align-items: center;
		background-color: var(--primary);
		color: #ffffff;
		padding: 0.6rem 1.25rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: background-color var(--transition-fast);

		&:hover {
			background-color: var(--primary-hover);
		}
	}
</style>
