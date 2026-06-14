<script lang="ts">
	import { RowToggleEvent } from '$lib/event';
	import type { EnhancedMetric } from '$lib/types';
	import { onMount } from 'svelte';
	import Row from './Row.svelte';
	import { browser } from '$app/environment';
	import DashboardForm from './DashboardForm.svelte';
	import { dashboardsRepo, Database, type DashboardEntity } from '$lib/db';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import BenchmarkSelector from './BenchmarkSelector.svelte';
	import { ArrowLeftRight, Maximize2, Minimize2, Save } from '@lucide/svelte';

	let { data, max, min }: { data: EnhancedMetric[]; max: number; min: number } = $props();
	let initShow: boolean = $state(false);
	let toggleEvent: RowToggleEvent;
	let title: string = $state('');
	let description: string = $state('');
	let dialog: HTMLDialogElement;
	let database: Database;
	let showCompare = $state(false);

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

<dialog bind:this={dialog} class="dashboard-dialog animate-modal">
	<div class="dialog-header">
		<h3 class="dialog-title">Save Profile Snapshot</h3>
		<p class="dialog-subtitle">Store this metrics snapshot to your local profile dashboard list.</p>
	</div>

	<div class="dialog-body">
		<DashboardForm bind:title bind:description></DashboardForm>
	</div>

	<div class="dialog-actions">
		<button class="btn-cancel" onclick={() => dialog.close()} aria-label="Cancel"> Cancel </button>
		<button
			class="primary"
			onclick={async () => {
				const dashboard: DashboardEntity = {
					title: title,
					description: description,
					metrics: data,
					date: new Date()
				};

				if (database.db) {
					const dashboardFirestore: DashboardEntityFirestore = {
						entity: dashboard,
						firebaseId: undefined,
						id: undefined
					};
					await dashboardsRepo.insertDashboard(database.db, dashboardFirestore);
					title = '';
					description = '';
					dialog.close();
				}
			}}
			disabled={!title.trim()}
			aria-label="Save"
		>
			<Save size="14" />
			Save Snapshot
		</button>
	</div>
</dialog>

<div class="table-toolbar">
	<div class="toolbar-left">
		<button onclick={() => expand()} aria-label="expand all rows">
			<Maximize2 size="14" />
			Expand All
		</button>
		<button onclick={() => collapse()} aria-label="collapse all rows">
			<Minimize2 size="14" />
			Collapse All
		</button>
		<button onclick={() => (showCompare = true)} aria-label="Compare benchmarks">
			<ArrowLeftRight size="14" />
			Compare
		</button>
	</div>

	<div class="toolbar-right">
		<button
			class="primary btn-save-dialog"
			onclick={() => {
				dialog.showModal();
			}}
			disabled={!data || data.length === 0}
			aria-label="Save current snapshot"
		>
			<Save size="14" />
			Save Snapshot
		</button>
	</div>
</div>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				<th class="col-func">Function Name</th>
				<th class="col-num">Nb Calls</th>
				<th class="col-num">Average (ms)</th>
				<th class="col-num">Min (ms)</th>
				<th class="col-num">Max (ms)</th>
				<th class="col-cpu">CPU time (ms) </th>
			</tr>
		</thead>
		<tbody>
			{#if data}
				{#each data as item (item.id)}
					{#if !item.caller}
						<Row currentItem={item} data={item.children} depth={0} {max} {min} {initShow} />
					{/if}
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- <BenchmarkSelector /> -->

<style>
	/* Toolbar styling */
	.table-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.toolbar-left,
	.toolbar-right {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Scrollable Table Container */
	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--table-border);
		border-radius: var(--radius-md);
		background-color: var(--panel-bg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
		transition:
			border-color var(--transition-normal),
			background-color var(--transition-normal);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		border-spacing: 0;
		text-align: left;
	}

	thead {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: var(--table-header);
		border-bottom: 2px solid var(--table-border);
	}

	th {
		padding: 0.85rem 1rem;
		font-size: 0.725rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--font-secondary);
		border-bottom: 1px solid var(--table-border);
		white-space: nowrap;
	}

	.col-func {
		width: 40%;
	}
	.col-num {
		text-align: right;
		width: 10%;
	}
	.col-cpu {
		width: 30%;
		padding-left: 2rem;
	}

	/* Custom dialog styling replacing generic browser model styling */
	dialog.dashboard-dialog {
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-lg);
		background-color: var(--dialog-bg);
		color: var(--font-color);
		box-shadow: var(--panel-shadow);
		padding: 1.5rem;
		max-width: 500px;
		width: 90%;
		box-sizing: border-box;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin: 0;
		overflow: visible;

		&::backdrop {
			background-color: var(--dialog-overlay);
			backdrop-filter: blur(4px);
		}
	}

	.dialog-header {
		margin-bottom: 1.5rem;
	}

	.dialog-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.35rem 0;
	}

	.dialog-subtitle {
		font-size: 0.85rem;
		color: var(--font-secondary);
		margin: 0;
	}

	.dialog-body {
		margin-bottom: 1.75rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;

		button {
			padding: 0.5rem 1.25rem;
		}
	}

	.animate-modal[open] {
		animation: scaleUp 0.25s;
	}

	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: translate(-50%, -48%) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	/* Responsive tweaks */
	@media (max-width: 640px) {
		.table-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
		.toolbar-left,
		.toolbar-right {
			width: 100%;
			button {
				flex: 1;
			}
		}
	}
</style>
