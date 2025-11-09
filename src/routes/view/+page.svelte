<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';

	let { data } = $props();

	let dashboards = $derived(data.dashboards);
</script>

<a href="/" aria-label="home"
	><svg
		xmlns="http://www.w3.org/2000/svg"
		width="50"
		height="50"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-move-left-icon lucide-move-left"
		><path d="M6 8L2 12L6 16" /><path d="M2 12H22" /></svg
	></a
>
{#if dashboards.length == 0}
	<div>No saved dashboards yet!</div>
{:else}
	<div class="dashboards">
		{#each dashboards as dashboard}
			<Dashboard {dashboard}></Dashboard>
		{/each}
	</div>
{/if}

<style>
	.dashboards {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		row-gap: 1rem;
		column-gap: 1rem;
	}

    a {
        text-decoration: none;
        color: var(--font-color);
        font-size: large;
    }
</style>
