<script lang="ts">
	import type { DiffMetric } from '$lib/types';
	import DownArrow from './DownArrow.svelte';
	import RightArrow from './RightArrow.svelte';
	import Self from './DiffRow.svelte';
	import { ArrowUp, ArrowDown } from '@lucide/svelte';

	let {
		diffMetric: item,
		depth
	}: {
		diffMetric: DiffMetric;
		depth: number;
	} = $props();

	let showChildren = $state(false);

	function toggle() {
		showChildren = !showChildren;
	}

	function format(n: number | null) {
		if (n === null) return '—';
		return Math.ceil(n);
	}

	function formatPct(pct: number | null | undefined): string {
		if (pct == null) return '';
		const sign = pct >= 0 ? '+' : '';
		return `${sign}${Math.round(pct)}%`;
	}

	let hasContent = $derived(item.baseline || item.comparison);

	let rowClass = $derived.by(() => {
		if (item.status === 'added') return 'row-added';
		if (item.status === 'removed') return 'row-removed';
		if (item.status === 'changed' && item.delta) {
			if (item.delta.cpuTimePct < 0) return 'row-improved';
			return 'row-regressed';
		}
		return '';
	});
</script>

{#if hasContent}
	<tr
		class="diff-row {rowClass}"
		class:has-children={item.children.length > 0}
		onclick={item.children.length > 0 ? () => toggle() : undefined}
	>
		<td class="col-func" class:dense={depth > 0}>
			<div style:--ml={(depth * 20).toString() + 'px'} class="func-name-container">
				{#if item.children.length > 0}
					<span class="arrow-icon">
						{#if showChildren}
							<DownArrow />
						{:else}
							<RightArrow />
						{/if}
					</span>
				{:else}
					<span class="arrow-spacer"></span>
				{/if}
				<div class="func-label">
					{#if depth === 0 && item.baseline}
						<span class="feeder-badge">{item.baseline.feederId}</span>
					{/if}
					{#if depth === 0 && !item.baseline && item.comparison}
						<span class="feeder-badge">{item.comparison.feederId}</span>
					{/if}
					<span class="func-id">{item.baseline?.fnId ?? item.comparison?.fnId ?? ''}</span>
					{#if item.status === 'added'}
						<span class="badge badge-new">NEW</span>
					{:else if item.status === 'removed'}
						<span class="badge badge-removed">REMOVED</span>
					{/if}
				</div>
			</div>
		</td>

		<td class="col-num">
			{#if item.comparison}
				<span class="val">
					{format(item.comparison.cpuTime)}
				</span>
			{:else}
				<span class="val dim">—</span>
			{/if}

			{#if item.baseline}
				<span class="sub">{format(item.baseline.cpuTime)}</span>
			{:else}
				<span class="sub dim">—</span>
			{/if}

			{#if item.delta}
				{@const pct = item.delta.cpuTimePct}
				{#if Math.abs(pct) > 1}
					{#if pct < 0}
						<ArrowDown size="10" />
					{:else}
						<ArrowUp size="10" />
					{/if}
				{/if}
				<span class="delta" class:improved={pct < 0} class:regressed={pct > 0}
					>{formatPct(pct)}</span
				>
			{/if}
		</td>

		<td class="col-num">
			{#if item.comparison}
				<span class="val">{format(item.comparison.average)}</span>
			{:else}
				<span class="val dim">—</span>
			{/if}
			{#if item.baseline}
				<span class="sub">{format(item.baseline.average)}</span>
			{:else}
				<span class="sub dim">—</span>
			{/if}
		</td>

		<td class="col-num">
			{#if item.comparison}
				<span class="val">
					{item.comparison.nbCalls}
				</span>
			{:else}
				<span class="val dim">—</span>
			{/if}
			{#if item.baseline}
				<span class="sub">{item.baseline.nbCalls}</span>
			{:else}
				<span class="sub dim">—</span>
			{/if}
		</td>

		<td class="col-num">
			{#if item.comparison}
				<span class="val">{format(item.comparison.min)}</span>
			{:else}
				<span class="val dim">—</span>
			{/if}
			{#if item.baseline}
				<span class="sub">{format(item.baseline.min)}</span>
			{:else}
				<span class="sub dim">—</span>
			{/if}
		</td>

		<td class="col-num">
			{#if item.comparison}
				<span class="val">{format(item.comparison.max)}</span>
			{:else}
				<span class="val dim">—</span>
			{/if}
			{#if item.baseline}
				<span class="sub">{format(item.baseline.max)}</span>
			{:else}
				<span class="sub dim">—</span>
			{/if}
		</td>
	</tr>

	{#if showChildren && item.children.length > 0}
		{#each item.children as child}
			<Self diffMetric={child} depth={depth + 1} />
		{/each}
	{/if}
{/if}

<style>
	.diff-row {
		transition: background-color var(--transition-fast);
		border-bottom: 1px solid var(--table-border);

		&:hover {
			background-color: var(--table-hover) !important;
		}
	}

	.has-children {
		cursor: pointer;
	}

	.dense td {
		padding: 0.4rem 0.75rem;
	}

	.row-removed {
		opacity: 0.6;
	}

	td {
		padding: 0.75rem 0.75rem;
		border-bottom: 1px solid var(--table-border);
		vertical-align: middle;
		white-space: nowrap;
	}

	.col-func {
		min-width: 180px;
	}

	.col-num {
		text-align: right;
		padding-right: 0.75rem;
		vertical-align: middle;
	}

	.func-name-container {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-left: var(--ml);
	}

	.arrow-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.1rem;
		color: var(--arrow-color);
		flex-shrink: 0;

		:global(svg) {
			width: 0.9rem;
			height: 0.9rem;
		}
	}

	.arrow-spacer {
		width: 1.1rem;
		flex-shrink: 0;
	}

	.func-label {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.feeder-badge {
		font-size: 0.5rem;
		padding: 0.05rem 0.25rem;
		border-radius: var(--radius-sm);
		background-color: var(--primary-soft);
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
		margin-bottom: 0.1rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		line-height: 1.2;
		width: fit-content;
	}

	.func-id {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
		font-size: 0.8rem;
		color: var(--font-color);
		word-break: break-all;
	}

	.val {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.sub {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.68rem;
		color: var(--font-muted);
		margin-top: 0.1rem;
	}

	.dim {
		color: var(--font-muted) !important;
	}

	.delta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.65rem;
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.improved {
		color: var(--success);
	}

	.regressed {
		color: var(--danger);
	}

	.badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.62rem;
		font-weight: 700;
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
		letter-spacing: 0.04em;
	}

	.badge-new {
		background-color: var(--info-soft);
		color: var(--info);
	}

	.badge-removed {
		background-color: transparent;
		color: var(--font-muted);
		border: 1px solid var(--table-border);
	}
</style>
