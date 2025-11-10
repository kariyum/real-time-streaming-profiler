<script lang="ts">
	import { RowToggleEvent } from '$lib/event';
	import type { EnhancedMetric } from '$lib/types';
	import { onMount } from 'svelte';
	import Row from './Row.svelte';
	import { browser } from '$app/environment';
	import DashboardForm from './DashboardForm.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	let { data, max, min }: { data: EnhancedMetric[]; max: number; min: number } = $props();
	let initShow: boolean = $state(false);
	let toggleEvent: RowToggleEvent;
	let title: string = $state('');
	let description: string = $state('');
	let dialog: HTMLDialogElement;
	let database: Database;
	onMount(async () => {
		if (browser) {
			toggleEvent = RowToggleEvent.getInstance();
			database = await Database.getInstance();
		}
	});

	function expand() {
		toggleEvent.toggleOn();
		initShow = true;
	}

	function collapse() {
		toggleEvent.toggleOff();
		initShow = false;
	}
</script>

<dialog bind:this={dialog}>
	<DashboardForm bind:title bind:description></DashboardForm>
	<div style="width: 100%">
		<div style="margin-left: auto; width: fit-content">
			<button
				onclick={async () => {
					if (database.db) {
						const dashboard: DashboardEntity = {
							title: title,
							description: description,
							metrics: data,
							date: new Date()
						};
						await dashboardsRepo.insertDashboard(database.db, dashboard);
						dialog.close();
					}
				}}>Save</button
			>
			<button onclick={() => dialog.close()}>Cancel</button>
		</div>
	</div>
</dialog>

<button onclick={() => expand()} aria-label="expand"> Expand</button>
<button onclick={() => collapse()} aria-label="collapse">Collapse</button>
<button
	onclick={() => {
		dialog.showModal();
	}}>Save</button
>
<div style="margin-top: 1rem;"></div>
<table>
	<thead>
		<tr>
			<th>Function Name</th>
			<th>Nb Calls</th>
			<th>Average</th>
			<th>Min</th>
			<th>Max</th>
			<th>CPU time</th>
		</tr>
	</thead>
	<tbody>
		{#if data}
			{#each data as item (item.id)}
				{#if !item.parent}
					<Row currentItem={item} data={item.children} depth={0} {max} {min} {initShow} />
				{/if}
			{/each}
		{/if}
	</tbody>
</table>

<style>
	table {
		font-family: arial, sans-serif;
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	/* table {
        white-space: nowrap;
    } */

	thead {
		position: sticky;
		background: var(--table-header);
		top: 0;
		padding: 0;
		margin: 0;
	}

	th {
		position: sticky;
		top: 0px;
		border: 1px solid var(--table-border);
		text-align: left;
		padding: 8px;
	}

	dialog {
		width: 30rem;
		height: 20rem;
		border: 2px solid var(--btn-border);
		border-radius: 5px;
		background-color: var(--dialog-bg);
	}
</style>
