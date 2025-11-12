<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { base64UrlEncode, copy } from '$lib/utils';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import firebase from '@firebase/app-compat';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import AsyncButton from './AsyncButton.svelte';
	import CopyButton from './CopyButton.svelte';

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

	<div style="width: 100%; margin-top: 2rem;">
		<div
			style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; row-gap: 0.5rem;"
		>
			<a href={resolve('/view') + `?local_id=${dashboard.id}`}>View from local</a>
			<div>
				<div style="width: fit-content; margin-left: auto;">
					<button
						onclick={async () => {
							if (dashboard.id) {
								await deleteDashboard(dashboard.id);
							}
							if (dashboard.firebaseId) {
								await dashboardsRepoFirebase.delete(dashboard.firebaseId);
							}
						}}>Delete</button
					>
				</div>
			</div>
			<a href={resolve('/share') + `?id=${dashboard.firebaseId}`}>View from cloud</a>
			<div>
				<div style="width: fit-content; margin-left: auto;">
					{#if dashboard.firebaseId}
						<CopyButton
							beforeCopyText={'Copy Share Link'}
							text={$page.url.origin + resolve('/share') + `?id=${dashboard.firebaseId}`}
						></CopyButton>
					{:else}
						{#snippet idleView()}
							Upload
						{/snippet}
						{#snippet endView()}
							Uploaded!
						{/snippet}
						<AsyncButton onclick={async () => uploadDashboard(dashboard)} {idleView} {endView}
						></AsyncButton>
					{/if}
				</div>
			</div>
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
