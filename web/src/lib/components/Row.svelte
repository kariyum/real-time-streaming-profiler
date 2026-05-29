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
		try {
			return n.toFixed(3);
		} catch {
			return 0;
		}
	}
	let children = $derived(data);
</script>

{#if currentItem.children.length > 0}
	<tr class="{depth != 0 ? 'greyed' : ''} arrow" onclick={() => toggle()}>
		<td>
			<div style:--ml={(depth * 30).toString() + 'px'} class="parent-row">
				{#if showChildren}
					<DownArrow></DownArrow>
				{:else}
					<RightArrow></RightArrow>
				{/if}
				<div>
					{currentItem.id}
				</div>
			</div>
		</td>
		<td>{currentItem.nbCalls}</td>
		<td>{format(currentItem.average)}</td>
		<td>{format(currentItem.min)}</td>
		<td>{format(currentItem.max)}</td>
		<td class="colored" style="--rowcolor: {currentItem.cpu_time / max}">
			{format(currentItem.cpu_time)} - {Math.floor((currentItem.cpu_time / max) * 100)}%
		</td>
	</tr>
{:else}
	<tr class={depth != 0 ? 'greyed' : ''}>
		<td>
			<div class={currentItem.parent ? 'child' : ''} style="--padding: calc({depth * 30}px);">
				{currentItem.id}
			</div>
		</td>
		<td>{currentItem.nbCalls}</td>
		<td>{format(currentItem.average)}</td>
		<td>{format(currentItem.min)}</td>
		<td>{format(currentItem.max)}</td>
		<td class="colored" style="--rowcolor: {currentItem.cpu_time / max}">
			{format(currentItem.cpu_time)} - {Math.floor((currentItem.cpu_time / max) * 100)}%
		</td>
	</tr>
{/if}
{#if showChildren && children.length > 0}
	{#each children as item (item.id)}
		<Self currentItem={item} data={item.children} depth={depth + 1} {min} {max} {initShow} />
	{/each}
{/if}

<style>
	tr:hover {
		background-color: var(--table-hover);
	}

	.child {
		margin: 0;
		padding: 0;
		margin-left: var(--padding);
	}
	.arrow {
		cursor: pointer;
		max-width: 1rem;
	}

	td {
		border: 1px solid var(--table-border);
		text-align: left;
		padding: 8px;
		inline-size: 1000px;
		overflow-wrap: break-word;
		max-width: 1000px;
	}
	.colored {
		background-color: light-dark(hsl(25, 100%, 50%, var(--rowcolor)), hsl(25, 100%, 25%, var(--rowcolor)));
	}

	.greyed {
		background-color: var(--child-row);
	}

	.parent-row {
		display: flex;
		gap: 0.4rem;
		padding: 0;
		margin: 0 0 0 var(--ml);
	}
</style>
