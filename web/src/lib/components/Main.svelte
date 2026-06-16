<script lang="ts">
	import type { EnhancedMetric, SingleMetric, SingleMetricWithSource } from '$lib/types.ts';
	import { onDestroy, onMount } from 'svelte';
	import { computeChildren, processData } from '../utils.ts';
	import { eventStreamState, eventStreamState as streamState } from '$lib/eventSource.svelte.ts';
	import Table from './Table.svelte';
	import { tooltip } from '$lib/attachments/Tooltip.ts';

	let enhancedMetrics: Array<EnhancedMetric> = $state([]);
	let obsolete = $derived(false);
	let metrics: SingleMetricWithSource[] = $state([]);
	let unsub: (() => void) | undefined;
	let setIntervalId: NodeJS.Timeout;

	onMount(() => {
		streamState.onreset(() => {
			metrics = [];
			enhancedMetrics = computeChildren(processData(metrics));
		});
		unsub = streamState.subscribe((fullData) => {
			metrics = fullData;
			obsolete = true;
		});
		enhancedMetrics = computeChildren(processData(metrics));
		setIntervalId = setInterval(() => {
			if (obsolete == true) {
				let start = performance.now();
				enhancedMetrics = computeChildren(processData(metrics));
				let end = performance.now();
				obsolete = false;
			}
		}, 1000);
	});

	onDestroy(() => {
		unsub?.();
		clearInterval(setIntervalId);
	});

	let globalMax: number = $derived.by(() => {
		return enhancedMetrics.length > 0 ? Math.max(...enhancedMetrics.map((a) => a.cpuTime)) : 0;
	});
	let globalMin: number = $derived.by(() => {
		return enhancedMetrics.length > 0 ? Math.min(...enhancedMetrics.map((a) => a.cpuTime)) : 0;
	});
</script>

<main class="main-container">
	<section class="table-section">
		<div class="table-header-row">
			{#if metrics.length > 0}
				<span class="data-summary">
					{metrics.length} data points
				</span>
			{/if}
		</div>

		{#if enhancedMetrics.length > 0}
			<Table data={enhancedMetrics} max={globalMax} min={globalMin} />
		{:else if eventStreamState.connected === 'open'}
			<div class="empty-state">
				<h3>Feeders are not feeding...</h3>
				<p>9x report?</p>
			</div>
		{:else}
			<div class="empty-state">
				<h3>Do you even stream bro?</h3>
				<p>Connect to your deployed sink server to begin streaming telemetry. bro.</p>
			</div>
		{/if}
	</section>
</main>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		margin-top: 1rem;
	}

	.panel-card {
		background-color: var(--panel-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--panel-shadow);
		padding: 1.5rem;
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal),
			box-shadow var(--transition-normal);
	}

	.table-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.data-summary {
		font-size: 0.775rem;
		color: var(--font-muted);
		display: block;
		margin-top: 0.25rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--font-secondary);

		h3 {
			font-size: 1.25rem;
			margin: 1rem 0 0.5rem 0;
		}

		p {
			max-width: 400px;
			margin: 0;
			font-size: 0.875rem;
			color: var(--font-muted);
		}
	}
</style>
