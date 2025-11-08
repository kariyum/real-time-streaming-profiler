<script lang="ts">
	import Table from './Table.svelte';
	import { processData, computeChildren } from '../utils.ts';
	import type { EnhancedMetric, SingleMetric } from '$lib/types.ts';

	let eventSource: EventSource | undefined = $state(undefined);
	let ip = $state('localhost');
	let service = $state('');

	let enhancedMetrics: Array<EnhancedMetric> = $state([]);
	let connected = $state(-1);
	let obsolete = $state(false);

	let metrics: SingleMetric[] = $state([]);
	metrics = [
		{
			id: 'test01',
			parent: null,
			start_end_times: [1 * 1000000, 6 * 1000000]
		},
		{
			id: 'test03',
			parent: null,
			start_end_times: [1 * 1000000, 6 * 1000000]
		},
		{
			id: 'test01',
			parent: null,
			start_end_times: [1 * 1000000, 7 * 1000000]
		},
		{
			id: 'test02',
			parent: 'test01',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test022',
			parent: 'test01',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test02',
			parent: 'test01',
			start_end_times: [4 * 1000000, 6 * 1000000]
		},
		{
			id: 'test05',
			parent: 'test02',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test06',
			parent: 'test05',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test07',
			parent: 'test02',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test08',
			parent: 'test06',
			start_end_times: [3 * 1000000, 5 * 1000000]
		},
		{
			id: 'test10',
			parent: 'test08',
			start_end_times: [3 * 1000000, 5 * 1000000]
		}
	];

	enhancedMetrics = computeChildren(processData(metrics));
	function connect() {
		if (eventSource) {
			eventSource.close();
			console.log('Closing last connection.');
		}
		eventSource = new EventSource(`http://localhost:8081/metrics-stream`);
		eventSource.onerror = (event) => {
			connected = 3;
		};
		eventSource.onopen = (event) => {
			connected = 1;
		};
		eventSource.onmessage = (event) => {
			if (eventSource) {
				connected = eventSource.readyState;
				if (event.data) {
					const data = JSON.parse(event.data);
					metrics.push(...data);
					obsolete = true;
				}
			}
		};
	}

	setInterval(() => {
		if (obsolete == true) {
			console.log('UPDATING.', metrics.length);
			let start = performance.now();
			enhancedMetrics = computeChildren(processData(metrics));
			let end = performance.now();
			console.log('TOOK: ', end - start);
			obsolete = false;
		}
	}, 1000);

	let globalMax: number = $derived.by(() => {
		return Math.max(...enhancedMetrics.map((a) => a.cpu_time));
	});
	let globalMin: number = $derived.by(() => {
		return Math.min(...enhancedMetrics.map((a) => a.cpu_time));
	});

	function disconnect() {
		if (connected === 1 && eventSource) {
			eventSource.close();
			connected = eventSource.readyState;
			eventSource = undefined;
		}
	}
	let buttonLabel = $state('Copy!');
</script>

<main>
	<!-- <ExpandableTableRow/> -->
	<h1>Metrics streaming 101 （￣︶￣）</h1>
	<input type="text" bind:value={ip} />
	<input type="text" bind:value={service} />
	<button onclick={() => connect()}>Connect</button>
	<button
		onclick={() => {
			enhancedMetrics = [];
			metrics = [];
		}}>Reset</button
	>
	<button onclick={disconnect}>Disconnect</button>
	<h1>
		{#if connected == 0}
			Connecting... ⌛ to {ip}
		{:else if connected == 1}
			Open ✅ {ip}
		{:else if connected == 2}
			Closed
		{:else if connected == 3}
			<span style="color:red;">ERROR</span> 😱😱😱
		{/if}
	</h1>
	<Table
		data={enhancedMetrics}
		max={globalMax}
		min={globalMin}
		globalShowChildren={toggleChildren}
	/>
	<button
		onclick={() => {
			navigator.clipboard
				.writeText(JSON.stringify(enhancedMetrics))
				.then(() => {
					// Provide user feedback
					buttonLabel = 'Copied!';

					// Optional: revert the button text after a few seconds
					setTimeout(() => {
						buttonLabel = 'Copy!';
					}, 2000);
				})
				.catch((err) => {
					console.error('Failed to copy text: ', err);
				});
		}}>{buttonLabel}</button
	>
	<pre>
    <!-- {JSON.stringify(computeChildren(enhancedMetrics), null, 2)} -->
  </pre>
</main>

<style>
	table {
		font-family: arial, sans-serif;
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}

	table td {
		white-space: nowrap;
	}

	thead {
		position: sticky;
		background: white;
		top: 0;
		padding: 0;
		margin: 0;
	}

	th {
		position: sticky;
		top: 0px;
		border: 1px solid #e3e3e3;
		text-align: left;
		padding: 8px;
	}

	td {
		border: 1px solid #e3e3e3;
		text-align: left;
		padding: 8px;
	}

	tr:nth-child(even) {
		background-color: #f0f0f0;
	}
</style>
