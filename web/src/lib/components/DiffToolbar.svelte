<script lang="ts">
	import type { DiffStatus } from '$lib/types';
	import { Maximize2, Minimize2, ArrowLeftRight, Filter } from '@lucide/svelte';

	let {
		filter,
		baselineLabel,
		comparisonLabel,
		onFilter,
		onExpandAll,
		onCollapseAll,
		onSwap
	}: {
		filter: DiffStatus | 'all';
		baselineLabel: string;
		comparisonLabel: string;
		onFilter: (f: DiffStatus | 'all') => void;
		onExpandAll: () => void;
		onCollapseAll: () => void;
		onSwap: () => void;
	} = $props();
</script>

<div class="diff-toolbar">
	<div class="toolbar-left">
		<div class="filter-group">
			<Filter size="14" />
			<select value={filter} onchange={(e) => onFilter(e.currentTarget.value as DiffStatus | 'all')}>
				<option value="all">All Functions</option>
				<option value="changed">Changed</option>
				<option value="added">Added</option>
				<option value="removed">Removed</option>
			</select>
		</div>
		<div class="divider"></div>
		<button onclick={onExpandAll} aria-label="Expand all">
			<Maximize2 size="14" />
			Expand All
		</button>
		<button onclick={onCollapseAll} aria-label="Collapse all">
			<Minimize2 size="14" />
			Collapse All
		</button>
	</div>

	<div class="toolbar-center">
		<span class="source-label">{baselineLabel}</span>
		<span class="vs-badge">vs</span>
		<span class="source-label">{comparisonLabel}</span>
	</div>

	<div class="toolbar-right">
		<button onclick={onSwap} aria-label="Swap baseline and comparison" title="Swap A ↔ B">
			<ArrowLeftRight size="14" />
			Swap
		</button>
	</div>
</div>

<style>
	.diff-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.toolbar-left,
	.toolbar-center,
	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--font-secondary);

		select {
			font-family: inherit;
			font-size: 0.8rem;
			padding: 0.35rem 0.6rem;
			border-radius: var(--radius-sm);
			border: 1px solid var(--btn-border);
			background-color: var(--btn-bg);
			color: var(--btn-color);
			cursor: pointer;
		}
	}

	.divider {
		width: 1px;
		height: 1.8rem;
		background-color: var(--table-border);
	}

	button {
		font-size: 0.78rem;
		padding: 0.4rem 0.75rem;
	}

	.vs-badge {
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: var(--radius-sm);
		background-color: var(--table-header);
		color: var(--font-muted);
		border: 1px solid var(--table-border);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.source-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--font-secondary);
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.diff-toolbar {
			flex-direction: column;
			align-items: stretch;
		}
		.toolbar-center {
			order: -1;
			justify-content: center;
		}
	}
</style>
