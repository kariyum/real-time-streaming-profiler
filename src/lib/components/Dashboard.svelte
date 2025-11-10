<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { base64UrlEncode } from '$lib/utils';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	let {
		dashboard,
		deleteDashboard
	}: { dashboard: DashboardEntity; deleteDashboard: (id: number) => Promise<void> } = $props();
	function formatDate(createdAt: Date): string {
		const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
		const day = createdAt.getDate().toString().padStart(2, '0');
		return `${day}/${month}/${createdAt.getFullYear()} ${createdAt.getHours()}:${createdAt.getMinutes()}`;
	}
</script>

<div class="card">
	<h2>{dashboard.title}</h2>
	<div>{dashboard.description}</div>
	<div>
		{formatDate(new Date(dashboard.date.toString()))}
	</div>

	<div style="width: 100%;">
		<div style="margin-left: auto; width:fit-content;">
			<button
				style="margin-top: 1rem; margin-right:0.5rem;"
				onclick={async () => {
					if (dashboard.id) {
						await deleteDashboard(dashboard.id);
					}
				}}>Delete</button
			>
			<a href={base + `/view?data=${base64UrlEncode(JSON.stringify(dashboard.metrics))}`}>View</a>
		</div>
	</div>
</div>

<style>
	.card {
		padding: 1rem;
		border: 2px solid var(--btn-border);
		border-radius: 5px;
	}

	h2 {
		padding: 0;
		margin: 0;
		margin-bottom: 1rem;
	}
</style>
