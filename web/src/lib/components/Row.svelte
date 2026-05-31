<script lang="ts">
	import { onMount } from 'svelte';
	import DownArrow from './DownArrow.svelte';
	import RightArrow from './RightArrow.svelte';
	import Self from './Row.svelte';
	import { browser } from '$app/environment';
	import { RowToggleEvent } from '$lib/event';

	let {
		currentItem,
		data,
		depth,
		min,
		max,
		initShow
	}: { currentItem: any; data: any; depth: any; min: any; max: any; initShow: boolean } = $props();

	let showChildren = $state(initShow);
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
		return n;
	}

	let ratio = $derived(max > 0 ? currentItem.cpu_time / max : 0);
	let percent = $derived(Math.round(ratio * 100));

	let children = $derived(data);
</script>

{#if currentItem.children.length > 0}
	<tr class="row-item has-children" class:depth-row={depth > 0} onclick={() => toggle()}>
		<td class="col-func">
			<div style:--ml={(depth * 24).toString() + 'px'} class="func-name-container">
				<!-- Indent Guidelines -->
				{#if depth > 0}
					<span class="indent-guide" style:--left-offset="-14px"></span>
				{/if}

				<span class="arrow-icon">
					{#if showChildren}
						<DownArrow></DownArrow>
					{:else}
						<RightArrow></RightArrow>
					{/if}
				</span>
				<span class="func-id">{currentItem.id}</span>
			</div>
		</td>
		<td class="col-num font-mono">{currentItem.nbCalls}</td>
		<td class="col-num font-mono">{format(currentItem.average)}</td>
		<td class="col-num font-mono">{format(currentItem.min)}</td>
		<td class="col-num font-mono">{format(currentItem.max)}</td>
		<td class="col-cpu">
			<div class="cpu-progress-wrapper" style:--rowcolor={ratio}>
				<div class="cpu-numbers font-mono">
					<span class="cpu-val">{format(currentItem.cpu_time)}</span>
					<span class="cpu-pct">{percent}%</span>
				</div>
				<div class="cpu-bar-track">
					<div class="cpu-bar-value" style="width: {percent}%"></div>
				</div>
			</div>
		</td>
	</tr>
{:else}
	<tr class="row-item" class:depth-row={depth > 0}>
		<td class="col-func">
			<div style:--ml={(depth * 24).toString() + 'px'} class="func-name-container">
				{#if depth > 0}
					<span class="indent-guide" style:--left-offset="-14px"></span>
				{/if}
				<!-- Spacer where the arrow would be to align text perfectly -->
				<span class="arrow-spacer"></span>
				<span class="func-id">{currentItem.id}</span>
			</div>
		</td>
		<td class="col-num font-mono">{currentItem.nbCalls}</td>
		<td class="col-num font-mono">{format(currentItem.average)}</td>
		<td class="col-num font-mono">{format(currentItem.min)}</td>
		<td class="col-num font-mono">{format(currentItem.max)}</td>
		<td class="col-cpu">
			<div class="cpu-progress-wrapper" style:--rowcolor={ratio}>
				<div class="cpu-numbers font-mono">
					<span class="cpu-val">{format(currentItem.cpu_time)}</span>
					<span class="cpu-pct">{percent}%</span>
				</div>
				<div class="cpu-bar-track">
					<div class="cpu-bar-value" style="width: {percent}%"></div>
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

	.func-id {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
		font-size: 0.875rem;
		color: var(--font-color);
		word-break: break-all;
	}

	/* CPU Progress Bar Visualizer */
	.cpu-progress-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-width: 260px;
		/* Add subtle color blend support in cells */
		background-color: rgba(249, 115, 22, calc(var(--rowcolor) * 0.05));
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
