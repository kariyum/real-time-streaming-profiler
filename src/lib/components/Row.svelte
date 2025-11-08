<script lang="ts">
	import DownArrow from './DownArrow.svelte';
	import RightArrow from './RightArrow.svelte';
	import Self from './Row.svelte';

	let { currentItem, data, depth, min, max } = $props();

	let showChildren = $state(false);
	function toggle() {
		console.log('TOGGLEINGIDJNGDI?');
		showChildren = !showChildren;
	}

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
			<div
				style="display: flex; gap: 0.5rem; margin:0; padding: 0; margin-left: calc({Math.max(
					0,
					depth
				) * 30}px)"
			>
				{#if showChildren}
					<DownArrow></DownArrow>
				{:else}
					<RightArrow></RightArrow>
				{/if}
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
		<Self currentItem={item} data={item.children} depth={depth + 1} {min} {max} />
	{/each}
{/if}

<style>
	tr:hover {
		background-color: rgb(196, 228, 255);
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
		border: 1px solid #e3e3e3;
		text-align: left;
		padding: 8px;
		inline-size: 1000px;
		overflow-wrap: break-word;
		max-width: 1000px;
	}
	.colored {
		background-color: hsl(25, 100%, 50%, var(--rowcolor));
	}

	.greyed {
		background-color: #f8f8f8;
	}
</style>
