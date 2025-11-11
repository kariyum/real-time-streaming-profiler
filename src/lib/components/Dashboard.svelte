<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { base64UrlEncode, copy } from '$lib/utils';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import firebase from '@firebase/app-compat';
	import { resolve } from '$app/paths';

	let {
		dashboard,
		deleteDashboard,
		uploadDashboard
	}: {
		dashboard: DashboardEntityFirestore;
		deleteDashboard: (id: number) => Promise<void>;
		uploadDashboard: (dashboard: DashboardEntityFirestore) => Promise<void>;
	} = $props();
	function formatDate(createdAt: Date): string {
		const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
		const day = createdAt.getDate().toString().padStart(2, '0');
		return `${day}/${month}/${createdAt.getFullYear()} ${createdAt.getHours()}:${createdAt.getMinutes()}`;
	}
</script>

<div class="card">
	<h2>{dashboard.entity.title}</h2>
	<div>{dashboard.entity.description}</div>
	<div>
		{formatDate(new Date(dashboard.entity.date.toString()))}
	</div>

	<div style="width: 100%;">
		<div style="margin-left: auto; width:fit-content;">
			<button
				style="margin-top: 1rem; margin-right:0.5rem;"
				onclick={async () => {
					if (dashboard.id) {
						await deleteDashboard(dashboard.id);
					}
					if (dashboard.firebaseId) {
						await dashboardsRepoFirebase.delete(dashboard.firebaseId);
					}
				}}>Delete</button
			>
			{#if dashboard.firebaseId}
				<button
					onclick={() => {
						copy(resolve('/share') + `?id=${dashboard.firebaseId}`);
					}}>Copy share link</button
				>
			{:else}
				<button onclick={async () => uploadDashboard(dashboard)}>Upload</button>
			{/if}
			<a href={resolve('/view') + `?local_id=${dashboard.id}`}>View</a>
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
