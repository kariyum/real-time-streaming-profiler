<script lang="ts" module>
	let dialog: HTMLDialogElement;
	export function openBenchmarkSelector() {
		dialog.showModal();
	}

	export function closeBenchmarkSelector() {
		dialog.close();
	}
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { closeOnClickOutisde } from '$lib/attachments/CloseOnClickOutside';
	import { dashboardsRepo, Database } from '$lib/db';
	import { eventStreamState } from '$lib/eventSource.svelte.ts';
	import { dashboardsRepoFirebase, type DashboardEntityFirestore } from '$lib/firebase';
	import { ArrowRight, Cloud, Database as DatabaseIcon, Radio } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let {
		preselectedBaseline
	}: {
		preselectedBaseline?: { type: string; id: string; label: string };
	} = $props();

	let localDashboards: DashboardEntityFirestore[] = $state([]);
	let cloudDashboards: DashboardEntityFirestore[] = $state([]);
	let isLoading = $state(false);
	let initialBaseline = preselectedBaseline ?? null;
	let baseline: { type: string; id: string | null; label: string } | null = $state(initialBaseline);
	let comparison: { type: string; id: string | null; label: string } | null = $state(null);
	let baselineTab: 'local' | 'cloud' | 'live' = $state('local');
	let comparisonTab: 'local' | 'cloud' | 'live' = $state('local');

	onMount(async () => {
		await loadLocal();
		await loadCloud();
	});

	async function loadLocal() {
		try {
			const db = await Database.getInstance();
			if (db.db) {
				localDashboards = await dashboardsRepo.getAllDashboards(db.db);
				localDashboards.sort((a, b) => {
					return a.entity.date.getTime() - b.entity.date.getTime();
				});
			}
		} catch (e) {
			console.error('Failed to load local dashboards:', e);
		}
	}

	async function loadCloud() {
		try {
			cloudDashboards = await dashboardsRepoFirebase.readAll();
			cloudDashboards.sort((a, b) => a.entity.date.getTime() - b.entity.date.getTime());
		} catch (e) {
			console.error('Failed to load cloud dashboards:', e);
		}
	}

	function selectBaseline(source: { type: string; id: string | null; label: string }) {
		baseline = source;
	}

	function selectComparison(source: { type: string; id: string | null; label: string }) {
		comparison = source;
	}

	function canCompare() {
		return (
			baseline && comparison && (baseline.id !== comparison.id || baseline.type !== comparison.type)
		);
	}

	function startCompare() {
		if (!baseline || !comparison) return;
		const bId = baseline.type === 'live' ? 'live' : `${baseline.type}:${baseline.id}`;
		const cId = comparison.type === 'live' ? 'live' : `${comparison.type}:${comparison.id}`;
		dialog.close();
		goto(`/compare?baseline=${bId}&comparison=${cId}`);
	}

	function formatDate(date: any): string {
		const d = new Date(date.toString());
		const month = (d.getMonth() + 1).toString().padStart(2, '0');
		const day = d.getDate().toString().padStart(2, '0');
		const hours = d.getHours().toString().padStart(2, '0');
		const minutes = d.getMinutes().toString().padStart(2, '0');
		return `${day}/${month} ${hours}:${minutes}`;
	}
</script>

<dialog bind:this={dialog} use:closeOnClickOutisde>
	<div class="overlay">
		<div class="selector-modal">
			<div class="modal-header">
				<h3>Compare Benchmarks</h3>
				<p class="modal-subtitle">Select a baseline and comparison to diff</p>
			</div>

			<div class="columns">
				<div class="column baseline-col">
					<h4 class="col-title">Baseline ({baseline?.label ?? 'None'})</h4>

					<div class="tabs">
						<button
							class="tab"
							class:active={baselineTab === 'local'}
							onclick={() => (baselineTab = 'local')}
						>
							<DatabaseIcon size="12" /> Local
						</button>
						<button
							class="tab"
							class:active={baselineTab === 'cloud'}
							onclick={() => (baselineTab = 'cloud')}
						>
							<Cloud size="12" /> Cloud
						</button>
						<button
							class="tab"
							class:active={baselineTab === 'live'}
							onclick={() => (baselineTab = 'live')}
						>
							<Radio size="12" /> Live
						</button>
					</div>

					<div class="source-list">
						{#if baselineTab === 'local'}
							{#each localDashboards as db}
								<button
									class="source-item"
									class:selected={baseline?.type === 'local' && baseline?.id === String(db.id)}
									onclick={() =>
										selectBaseline({ type: 'local', id: String(db.id), label: db.entity.title })}
								>
									<span class="item-title">{db.entity.title}</span>
									<span class="item-meta"
										>{db.entity.metrics.length} metrics · {formatDate(db.entity.date)}</span
									>
								</button>
							{/each}
							{#if localDashboards.length === 0}
								<div class="empty-source">No local dashboards</div>
							{/if}
						{:else if baselineTab === 'cloud'}
							{#each cloudDashboards as db}
								<button
									class="source-item"
									class:selected={baseline?.type === 'cloud' && baseline?.id === db.firebaseId}
									onclick={() =>
										selectBaseline({ type: 'cloud', id: db.firebaseId!, label: db.entity.title })}
								>
									<span class="item-title">{db.entity.title}</span>
									<span class="item-meta"
										>{db.entity.metrics.length} metrics · {formatDate(db.entity.date)}</span
									>
								</button>
							{/each}
							{#if cloudDashboards.length === 0}
								<div class="empty-source">No cloud dashboards</div>
							{/if}
						{:else if eventStreamState.connected === 'open'}
							<button
								class="source-item"
								class:selected={baseline?.type === 'live'}
								onclick={() => selectBaseline({ type: 'live', id: null, label: 'Live Stream' })}
							>
								<span class="item-title">Live Stream</span>
								<span class="item-meta"
									>{eventStreamState.onlineFeeders.length} feeder(s) · {eventStreamState.metrics
										.length} points</span
								>
							</button>
						{:else}
							<div class="empty-source">Stream not connected</div>
						{/if}
					</div>
				</div>

				<div class="column comparison-col">
					<h4 class="col-title">Comparison ({comparison?.label ?? 'None'})</h4>

					<div class="tabs">
						<button
							class="tab"
							class:active={comparisonTab === 'local'}
							onclick={() => (comparisonTab = 'local')}
						>
							<DatabaseIcon size="12" /> Local
						</button>
						<button
							class="tab"
							class:active={comparisonTab === 'cloud'}
							onclick={() => (comparisonTab = 'cloud')}
						>
							<Cloud size="12" /> Cloud
						</button>
						<button
							class="tab"
							class:active={comparisonTab === 'live'}
							onclick={() => (comparisonTab = 'live')}
						>
							<Radio size="12" /> Live
						</button>
					</div>

					<div class="source-list">
						{#if comparisonTab === 'local'}
							{#each localDashboards as db}
								<button
									class="source-item"
									class:selected={comparison?.type === 'local' && comparison?.id === String(db.id)}
									onclick={() =>
										selectComparison({ type: 'local', id: String(db.id), label: db.entity.title })}
								>
									<span class="item-title">{db.entity.title}</span>
									<span class="item-meta"
										>{db.entity.metrics.length} metrics · {formatDate(db.entity.date)}</span
									>
								</button>
							{/each}
							{#if localDashboards.length === 0}
								<div class="empty-source">No local dashboards</div>
							{/if}
						{:else if comparisonTab === 'cloud'}
							{#each cloudDashboards as db}
								<button
									class="source-item"
									class:selected={comparison?.type === 'cloud' && comparison?.id === db.firebaseId}
									onclick={() =>
										selectComparison({ type: 'cloud', id: db.firebaseId!, label: db.entity.title })}
								>
									<span class="item-title">{db.entity.title}</span>
									<span class="item-meta"
										>{db.entity.metrics.length} metrics · {formatDate(db.entity.date)}</span
									>
								</button>
							{/each}
							{#if cloudDashboards.length === 0}
								<div class="empty-source">No cloud dashboards</div>
							{/if}
						{:else if eventStreamState.connected === 'open'}
							<button
								class="source-item"
								class:selected={comparison?.type === 'live'}
								onclick={() => selectComparison({ type: 'live', id: null, label: 'Live Stream' })}
							>
								<span class="item-title">Live Stream</span>
								<span class="item-meta"
									>{eventStreamState.onlineFeeders.length} feeder(s) · {eventStreamState.metrics
										.length} points</span
								>
							</button>
						{:else}
							<div class="empty-source">Stream not connected</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="primary" disabled={!canCompare()} onclick={startCompare}>
					<ArrowRight size="14" />
					Compare
				</button>
			</div>
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: none;
		background-color: transparent;
	}
	::backdrop {
		backdrop-filter: blur(2px);
	}
	.overlay {
		align-items: center;
		justify-content: center;
		border: none;
		margin: 0;
	}

	.selector-modal {
		background-color: var(--dialog-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		max-width: 800px;
		max-height: 85vh;
		width: 60rem;
		height: 40rem;
		display: flex;
		flex-direction: column;
		box-shadow: var(--panel-shadow);
		animation: scaleUp 0.2s;
	}

	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-header {
		margin-bottom: 1.25rem;

		h3 {
			margin: 0 0 0.25rem 0;
			font-size: 1.15rem;
		}
	}

	.modal-subtitle {
		margin: 0;
		font-size: 0.82rem;
		color: var(--font-secondary);
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 0;
	}

	.col-title {
		font-size: 0.82rem;
		font-weight: 700;
		margin: 0;
		color: var(--font-color);
	}

	.tabs {
		display: flex;
		gap: 0.25rem;

		.tab {
			flex: 1;
			font-size: 0.7rem;
			padding: 0.35rem 0.5rem;
			background-color: transparent;
			border: 1px solid var(--btn-border);
			color: var(--font-secondary);

			&.active {
				background-color: var(--primary-soft);
				color: var(--primary);
				border-color: var(--primary);
			}

			:global(svg) {
				width: 0.75rem;
				height: 0.75rem;
			}
		}
	}

	.source-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		border: 1px solid var(--table-border);
		border-radius: var(--radius-sm);
		padding: 0.4rem;
		min-height: 200px;
	}

	.source-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding: 0.5rem 0.65rem;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		background-color: transparent;
		text-align: left;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);

		&:hover {
			background-color: var(--table-hover);
		}

		&.selected {
			background-color: var(--primary-soft);
			border-color: var(--primary);
		}
	}

	.item-title {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--font-color);
	}

	.item-meta {
		font-size: 0.68rem;
		color: var(--font-muted);
		font-family: 'JetBrains Mono', monospace;
	}

	.empty-source {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--font-muted);
		font-size: 0.8rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--table-border);
	}

	@media (max-width: 640px) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
