<script lang="ts">
	import type { EnhancedMetric, SingleMetric } from '$lib/types.ts';
	import { onDestroy } from 'svelte';
	import { computeChildren, processData } from '../utils.ts';
	import { eventStreamState as streamState } from '$lib/eventSource.svelte.ts';
	import Table from './Table.svelte';

	let enhancedMetrics: Array<EnhancedMetric> = $state([]);
	let obsolete = $state(false);
	let metrics: SingleMetric[] = $state([]);
	let unsub: (() => void) | undefined;

	unsub = streamState.subscribe((data) => {
		metrics.push(...data);
		obsolete = true;
	});

	onDestroy(() => {
		unsub?.();
	});

	setInterval(() => {
		if (obsolete == true) {
			console.log('UPDATING.', metrics.length);
			let start = performance.now();
			enhancedMetrics = computeChildren(processData(metrics));
			let end = performance.now();
			console.log('TOOK: ', end - start);
			obsolete = false;
		}
	}, 1000);

	let globalMax: number = $derived.by(() => {
		return enhancedMetrics.length > 0 ? Math.max(...enhancedMetrics.map((a) => a.cpu_time)) : 0;
	});
	let globalMin: number = $derived.by(() => {
		return enhancedMetrics.length > 0 ? Math.min(...enhancedMetrics.map((a) => a.cpu_time)) : 0;
	});
</script>

<main class="main-container">
	<section class="table-section panel-card">
		<div class="table-header-row">
			{#if metrics.length > 0}
				<span class="data-summary">
					Showing {metrics.length} raw records grouped by function node
				</span>
			{/if}
		</div>

		{#if enhancedMetrics.length > 0}
			<Table data={enhancedMetrics} max={globalMax} min={globalMin} />
		{:else}
			<div class="empty-state">
				<h3>No profiling data available</h3>
				<p>Connect to an active SSE endpoint to begin streaming program telemetry.</p>
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
