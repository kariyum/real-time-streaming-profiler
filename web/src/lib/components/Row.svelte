<script lang="ts">
	import { onMount } from 'svelte';
	import DownArrow from './DownArrow.svelte';
	import RightArrow from './RightArrow.svelte';
	import Self from './Row.svelte';
	import { browser } from '$app/environment';
	import { RowToggleEvent } from '$lib/event';
	import type { EnhancedMetric } from '$lib/types';
	import { tooltip } from '$lib/attachments/Tooltip';

	let {
		currentItem,
		data,
		depth,
		min,
		max,
		initShow
	}: {
		currentItem: EnhancedMetric;
		data: EnhancedMetric[];
		depth: number;
		min: number;
		max: number;
		initShow: boolean;
	} = $props();

	let showChildren = $derived(initShow);
	function toggle() {
		showChildren = !showChildren;
		initShow = false;
	}

	let toggleEvent: RowToggleEvent;

	onMount(() => {
		if (browser) {
			toggleEvent = RowToggleEvent.getInstance();
			toggleEvent.subscribeToggleOn(() => {
				showChildren = true;
				initShow = true;
			});
			toggleEvent.subscribeToggleOff(() => {
				showChildren = false;
			});
		}
	});

	function format(n: number) {
		return Math.ceil(n);
	}

	let ratio = $derived(max > 0 ? currentItem.cpuTime / max : 0);
	let percent = $derived(Math.round(ratio * 100));

	let selfTimeDisplay = $derived(
		format(currentItem.selfTime) + 'ms (' + Math.round(currentItem.selfTimePct) + '%)'
	);

	let children = $derived(data);
</script>

{#if currentItem.children.length > 0}
	<tr class="row-item has-children" class:depth-row={depth > 0} onclick={() => toggle()}>
		<td class="col-func">
			<div style:--ml={(depth * 24).toString() + 'px'} class="func-name-container">
				<!-- {#if depth > 0}
					<span class="indent-guide" style:--left-offset="-14px"></span>
				{/if} -->

				<span class="arrow-icon">
					{#if showChildren}
						<DownArrow></DownArrow>
					{:else}
						<RightArrow></RightArrow>
					{/if}
				</span>
				<div class="func-label">
					{#if depth === 0}
						<span class="feeder-badge">{currentItem.feederId}</span>
					{/if}
					<span class="func-id">{currentItem.fnId}</span>
				</div>
			</div>
		</td>
		<td class="col-num font-mono">{currentItem.nbCalls}</td>
		<td class="col-num font-mono">{format(currentItem.average)}</td>
		<td class="col-num font-mono">{format(currentItem.min)}</td>
		<td class="col-num font-mono">{format(currentItem.max)}</td>
		<td class="col-cpu">
			<div class="cpu-progress-wrapper" style:--rowcolor={ratio} {@attach tooltip(selfTimeDisplay)}>
				<div class="cpu-numbers font-mono">
					<span class="cpu-val">{format(currentItem.cpuTime)}</span>
					<span class="cpu-pct">{percent}%</span>
				</div>
			</div>
		</td>
	</tr>
{:else}
	<tr class="row-item" class:depth-row={depth > 0}>
		<td class="col-func">
			<div style:--ml={(depth * 24).toString() + 'px'} class="func-name-container">
				<span class="arrow-spacer"></span>
				<div class="func-label">
					{#if depth === 0}
						<span class="feeder-badge">{currentItem.feederId}</span>
					{/if}
					<span class="func-id">{currentItem.fnId}</span>
				</div>
			</div>
		</td>
		<td class="col-num font-mono">{currentItem.nbCalls}</td>
		<td class="col-num font-mono">{format(currentItem.average)}</td>
		<td class="col-num font-mono">{format(currentItem.min)}</td>
		<td class="col-num font-mono">{format(currentItem.max)}</td>
		<td class="col-cpu">
			<div class="cpu-progress-wrapper" style:--rowcolor={ratio}>
				<div class="cpu-numbers font-mono">
					<span class="cpu-val">{format(currentItem.cpuTime)}</span>
					<span class="cpu-pct">{percent}%</span>
				</div>
			</div>
		</td>
	</tr>
{/if}

{#if showChildren && children.length > 0}
	{#each children as item (item.id)}
		<Self currentItem={item} data={item.children} depth={depth + 1} {min} {max} {initShow} />
	{/each}
{/if}

<style>
	.row-item {
		transition: background-color var(--transition-fast);
		border-bottom: 1px solid var(--table-border);

		&:hover {
			background-color: var(--table-hover) !important;
		}
	}

	.has-children {
		cursor: pointer;
	}

	.depth-row {
		background-color: var(--child-row);
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--table-border);
		vertical-align: middle;
	}

	.col-func {
		width: 40%;
	}
	.col-num {
		text-align: right;
		width: 10%;
		color: var(--font-secondary);
	}
	.col-cpu {
		width: 30%;
		padding-left: 2rem;
	}

	.font-mono {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
	}

	/* Hierarchy & Indent guides */
	.func-name-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		margin-left: var(--ml);
	}

	.indent-guide {
		position: absolute;
		left: var(--left-offset);
		top: -0.75rem;
		bottom: -0.75rem;
		width: 1px;
		background-color: var(--table-border);
	}

	.arrow-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		transition: transform var(--transition-fast);
		color: var(--arrow-color);

		:global(svg) {
			width: 1rem;
			height: 1rem;
		}
	}

	.arrow-spacer {
		width: 1.25rem;
	}

	.func-label {
		display: flex;
		flex-direction: column;
	}

	.feeder-badge {
		font-size: 0.55rem;
		padding: 0.05rem 0.3rem;
		border-radius: var(--radius-sm);
		background-color: var(--primary-soft);
		color: var(--primary);
		font-family: 'JetBrains Mono', monospace;
		margin-bottom: 0.15rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		line-height: 1.2;
		width: fit-content;
	}

	.func-id {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
		font-size: 0.875rem;
		color: var(--font-color);
		word-break: break-all;
	}

	.cpu-progress-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-width: 260px;
		/* Add subtle color blend support in cells */
		background-color: rgba(249, 115, 22, calc(var(--rowcolor)));
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
	}

	.cpu-numbers {
		display: flex;
		justify-content: space-between;
		font-size: 0.775rem;
		font-weight: 600;
	}

	.cpu-val {
		color: var(--font-color);
	}

	.cpu-pct {
		color: var(--primary);
	}

	.cpu-bar-track {
		height: 4px;
		width: 100%;
		background-color: var(--cpu-bar-bg);
		border-radius: 2px;
		overflow: hidden;
	}

	.cpu-bar-value {
		height: 100%;
		background: var(--cpu-bar-fill);
		border-radius: 2px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Soft highlight row indicator for high cpu time */
	.row-item {
		background-color: transparent;
	}
</style>
