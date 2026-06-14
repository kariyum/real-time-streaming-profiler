<script lang="ts">
	import { page } from '$app/state';
	import { dashboardsRepoFirebase } from '$lib/firebase';
	import { dashboardsRepo, Database } from '$lib/db';
	import { eventStreamState } from '$lib/eventSource.svelte.ts';
	import { diffTrees } from '$lib/diff';
	import DiffTable from '$lib/components/DiffTable.svelte';
	import type { EnhancedMetric } from '$lib/types';
	import { untrack } from 'svelte';

	let rawBaseline = $state<EnhancedMetric[] | null>(null);
	let rawComparison = $state<EnhancedMetric[] | null>(null);
	let baselineLabel = $state('');
	let comparisonLabel = $state('');
	let isLoading = $state(true);
	let errorMessage = $state<string | undefined>();

	let diffResult = $derived.by(() => {
		if (!rawBaseline || !rawComparison) return null;
		return diffTrees(processForDiff(rawBaseline), processForDiff(rawComparison));
	});

	function handleSwap() {
		const tmpMetrics = rawBaseline;
		rawBaseline = rawComparison;
		rawComparison = tmpMetrics;
		const tmpLabel = baselineLabel;
		baselineLabel = comparisonLabel;
		comparisonLabel = tmpLabel;
	}

	$effect.pre(() => {
		const baselineParam = page.url.searchParams.get('baseline');
		const comparisonParam = page.url.searchParams.get('comparison');
		if (!baselineParam || !comparisonParam) {
			errorMessage = 'Missing baseline or comparison parameter.';
			isLoading = false;
			return;
		}
		untrack(() => {
			isLoading = true;
			Promise.all([loadBenchmark(baselineParam), loadBenchmark(comparisonParam)])
				.then(([baselineData, comparisonData]) => {
					if (!baselineData || !comparisonData) {
						isLoading = false;
						return;
					}
					baselineLabel = baselineData.label;
					comparisonLabel = comparisonData.label;
					rawBaseline = baselineData.metrics;
					rawComparison = comparisonData.metrics;
					isLoading = false;
				})
				.catch((e) => {
					console.error('Compare error:', e);
					errorMessage = String(e);
					isLoading = false;
				});
		});
	});

	async function loadBenchmark(
		param: string
	): Promise<{ metrics: EnhancedMetric[]; label: string } | null> {
		if (param === 'live') {
			if (eventStreamState.connected !== 'open') return null;
			return {
				metrics: eventStreamState.getProcessedMetrics(),
				label: 'Live Stream'
			};
		}
		const [source, sourceId] = param.split(':');
		if (!source || !sourceId) return null;
		try {
			if (source === 'local') {
				const db = await Database.getInstance();
				if (!db.db) return null;
				const dashboard = await dashboardsRepo.getById(db.db, parseInt(sourceId));
				return { metrics: dashboard.entity.metrics, label: dashboard.entity.title };
			}
			if (source === 'cloud') {
				const entity = await dashboardsRepoFirebase.readById(sourceId);
				if (!entity) return null;
				return { metrics: entity.metrics, label: entity.title };
			}
		} catch (e) {
			console.error(`Failed to load ${source}:${sourceId}`, e);
			return null;
		}
		return null;
	}

	function processForDiff(metrics: EnhancedMetric[]): EnhancedMetric[] {
		return JSON.parse(JSON.stringify(metrics));
	}
</script>

<div class="compare-page">
	{#if isLoading}
		<div class="loading-state">
			<p>Loading benchmarks...</p>
		</div>
	{:else if errorMessage}
		<div class="error-state">
			<h3>Error</h3>
			<p>{errorMessage}</p>
			<a href="/" class="back-link">Return to home</a>
		</div>
	{:else if diffResult}
		<DiffTable {diffResult} {baselineLabel} {comparisonLabel} onSwap={handleSwap} />
	{/if}
</div>

<style>
	.compare-page {
		margin-top: 1rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;

		h2 {
			margin: 0;
			font-size: 1.25rem;
		}
	}

	.back-link {
		font-size: 0.85rem;
		color: var(--primary);
		text-decoration: none;
		font-weight: 600;

		&:hover {
			text-decoration: underline;
		}
	}

	.loading-state,
	.error-state {
		padding: 4rem 2rem;
		text-align: center;
		color: var(--font-secondary);

		h3 {
			margin: 0 0 0.5rem 0;
		}

		p {
			margin: 0;
		}
	}
</style>
