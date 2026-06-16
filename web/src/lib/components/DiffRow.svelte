<script lang="ts" module>
	export function expand() {
		initialShow = true;
		subs.forEach((f) => f(true));
	}
	export function collapse() {
		initialShow = false;
		subs.forEach((f) => f(false));
	}

	let subs: ((show: boolean) => void)[] = [];

	function onToggle(f: (show: boolean) => void) {
		subs.push(f);
		return () => {
			subs = subs.filter((handler) => handler != f);
		};
	}

	let initialShow: boolean = $state(false);
</script>

<script lang="ts">
	import type {
		DeltaMetricDiff,
		DeltaMetricDiffSimple,
		DeltaMetrics,
		DiffMetric
	} from '$lib/types';
	import { DiffMetricSchema } from '$lib/types';
	import { onMount } from 'svelte';
	import { z } from 'zod';
	import Self from './DiffRow.svelte';
	import DownArrow from './DownArrow.svelte';
	import RightArrow from './RightArrow.svelte';

	let {
		diffMetric: item,
		depth
	}: {
		diffMetric: z.infer<typeof DiffMetricSchema>;
		depth: number;
	} = $props();

	let showChildren = $state(initialShow);

	onMount(() => {
		const unsub = onToggle((show) => {
			showChildren = show;
		});

		return unsub;
	});

	function toggle() {
		showChildren = !showChildren;
		initialShow = false;
	}

	function format(n: number | null) {
		if (n === null) return '—';
		return Math.round(n * 100) / 100;
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
			if (item.delta.cpuTime.pct < 0) return 'row-improved';
			return 'row-regressed';
		}
		return '';
	});

	let columns: (keyof DeltaMetrics)[] = ['nbCalls', 'average', 'min', 'max', 'cpuTime'];
	let isExpanded: boolean = $state(false);
</script>

{#snippet cols(metric: DiffMetric)}
	{#each columns as col}
		{#if metric.delta}
			<td class="col-num">
				{#if metric.delta[col].type === 'simple'}
					{@render renderSimpleDiffMetric(metric.delta[col] as DeltaMetricDiffSimple)}
				{:else if metric.delta[col].type === 'pct'}
					{@render renderDeltaDiffMetric(metric.delta[col] as DeltaMetricDiff)}
				{:else}
					unknown type expected 'simple' or 'pct'
				{/if}
			</td>
		{:else if metric.baseline}
			<td class="col-num">
				<span class="val dim">NA</span>
				/
				<span class="val">{format(metric.baseline[col])}</span>
			</td>
		{:else if metric.comparison}
			<td class="col-num">
				<span class="val">{format(metric.comparison[col])}</span>
				/
				<span class="val dim">NA</span>
			</td>
		{:else}
			<td> Unexpected case {JSON.stringify(metric)} </td>
		{/if}
	{/each}
{/snippet}

{#snippet renderDeltaDiffMetric(metric: DeltaMetricDiff)}
	<span class="val">
		{format(metric.comparison)}
	</span>
	<span class="delta sign" class:improved={metric.delta < 0} class:regressed={metric.delta > 0}
		>{format(Math.abs(metric.delta))}</span
	>

	<span class="delta" class:improved={metric.pct < 0} class:regressed={metric.pct > 0}
		>({formatPct(metric.pct)})</span
	>
{/snippet}

{#snippet renderSimpleDiffMetric(metric: DeltaMetricDiffSimple)}
	<span class="val">
		{format(metric.comparison)}
	</span>
	{#if metric.delta !== 0}
		<span class="delta sign" class:improved={metric.delta < 0} class:regressed={metric.delta > 0}
			>{format(Math.abs(metric.delta))}</span
		>
	{/if}
{/snippet}

{#snippet renderFunctionId(id: string)}
	<span class="func-id" class:ellipsis={!isExpanded}>{id}</span>
	{#if id.length > 300}
		<div>
			<button class="readmore" onclick={() => (isExpanded = !isExpanded)}>
				{#if isExpanded}
					collapse
				{:else}
					read more...
				{/if}
			</button>
		</div>
	{/if}
{/snippet}

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
					{@render renderFunctionId(item.baseline?.fnId ?? item.comparison?.fnId ?? '???')}
					<div>
						{#if item.status === 'added'}
							<span class="badge badge-new">NEW</span>
						{:else if item.status === 'removed'}
							<span class="badge badge-removed">REMOVED</span>
						{/if}
					</div>
				</div>
			</div>
		</td>

		{@render cols(item)}
	</tr>

	{#if showChildren && item.children.length > 0}
		{#each item.children as child}
			<Self diffMetric={child} depth={depth + 1} />
		{/each}
	{/if}
{/if}

<style>
	.readmore {
		border: none;
		background-color: transparent;
		padding: 0;
		margin: 0;
		text-decoration: underline;
	}
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 70ch;
	}
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
	}

	.col-func {
		word-break: break-all;
	}

	.col-num {
		text-align: right;
		padding-right: 0.75rem;
		vertical-align: middle;
		white-space: nowrap;
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
		--content: '-';
	}

	.regressed {
		color: var(--danger);
		--content: '+';
	}

	.sign::before {
		content: var(--content);
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
