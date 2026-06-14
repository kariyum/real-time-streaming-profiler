<script lang="ts">
	import type { DiffResult, DiffMetric, DiffStatus } from '$lib/types';
	import DiffToolbar from './DiffToolbar.svelte';
	import DiffRow from './DiffRow.svelte';
	import { ArrowUp, ArrowDown } from '@lucide/svelte';

	let {
		diffResult,
		baselineLabel,
		comparisonLabel,
		onSwap
	}: {
		diffResult: DiffResult;
		baselineLabel: string;
		comparisonLabel: string;
		onSwap?: () => void;
	} = $props();

	let filter: DiffStatus | 'all' = $state('all');
	let allExpanded = $state(false);

	let filteredNodes = $derived.by(() => {
		if (filter === 'all') return diffResult.rootNodes;
		return filterNodes(diffResult.rootNodes, filter);
	});

	function filterNodes(nodes: DiffMetric[], status: DiffStatus | 'all'): DiffMetric[] {
		const result: DiffMetric[] = [];
		for (const node of nodes) {
			const filteredChildren = filterNodes(node.children, status);
			if (node.status === status || status === 'all') {
				result.push({ ...node, children: filteredChildren });
			} else if (filteredChildren.length > 0) {
				result.push({ ...node, children: filteredChildren });
			}
		}
		return result;
	}

	function expandAll() {
		allExpanded = true;
	}

	function collapseAll() {
		allExpanded = false;
	}

	function swap() {
		onSwap?.();
	}
</script>

<div class="diff-container">
	<DiffToolbar
		{filter}
		{baselineLabel}
		{comparisonLabel}
		onFilter={(f) => (filter = f)}
		onExpandAll={expandAll}
		onCollapseAll={collapseAll}
		onSwap={swap}
	/>

	<div class="summary-bar">
		<span class="stat">Total: <strong>{diffResult.summary.totalFunctions}</strong></span>
		{#if diffResult.summary.improved > 0}
			<span class="stat improved"><ArrowDown size="12" /> <strong>{diffResult.summary.improved}</strong> improved</span>
		{/if}
		{#if diffResult.summary.regressed > 0}
			<span class="stat regressed"><ArrowUp size="12" /> <strong>{diffResult.summary.regressed}</strong> regressed</span>
		{/if}
		{#if diffResult.summary.added > 0}
			<span class="stat added"><strong>{diffResult.summary.added}</strong> added</span>
		{/if}
		{#if diffResult.summary.removed > 0}
			<span class="stat removed"><strong>{diffResult.summary.removed}</strong> removed</span>
		{/if}
	</div>

	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th class="col-func">Function</th>
					<th class="col-num">
						<div class="col-header">
							<span class="col-label">CPU</span>
							<span class="col-sub">comp (Δ) / base</span>
						</div>
					</th>
					<th class="col-num">
						<div class="col-header">
							<span class="col-label">Avg</span>
							<span class="col-sub">comp / base</span>
						</div>
					</th>
					<th class="col-num">
						<div class="col-header">
							<span class="col-label">Calls</span>
							<span class="col-sub">comp (Δ) / base</span>
						</div>
					</th>
					<th class="col-num">
						<div class="col-header">
							<span class="col-label">Min</span>
							<span class="col-sub">comp / base</span>
						</div>
					</th>
					<th class="col-num">
						<div class="col-header">
							<span class="col-label">Max</span>
							<span class="col-sub">comp / base</span>
						</div>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredNodes as node (node.baseline?.id ?? node.comparison?.id)}
					<DiffRow diffMetric={node} depth={0} />
				{/each}
			</tbody>
		</table>

		{#if filteredNodes.length === 0}
			<div class="empty-diff">
				No functions match the current filter.
			</div>
		{/if}
	</div>
</div>

<style>
	.diff-container {
		width: 100%;
	}

	.summary-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		margin-bottom: 0.5rem;
		font-size: 0.78rem;
		flex-wrap: wrap;
	}

	.stat {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--font-secondary);

		strong {
			color: var(--font-color);
		}

		:global(svg) {
			width: 0.75rem;
			height: 0.75rem;
		}
	}

	.improved {
		color: var(--success);
		strong { color: var(--success); }
	}

	.regressed {
		color: var(--danger);
		strong { color: var(--danger); }
	}

	.added {
		color: var(--info);
		strong { color: var(--info); }
	}

	.removed {
		color: var(--font-muted);
		strong { color: var(--font-muted); }
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--table-border);
		border-radius: var(--radius-md);
		background-color: var(--panel-bg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
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
		padding: 0.7rem 0.75rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: var(--font-secondary);
		border-bottom: 1px solid var(--table-border);
		white-space: nowrap;
	}

	.col-func {
		min-width: 180px;
	}

	.col-num {
		text-align: right;
		padding-right: 1rem;
	}

	.col-header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.col-label {
		font-size: 0.68rem;
	}

	.col-sub {
		font-size: 0.58rem;
		color: var(--font-muted);
		font-weight: 500;
		letter-spacing: 0.04em;
	}

	.empty-diff {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--font-muted);
		font-size: 0.85rem;
	}
</style>
