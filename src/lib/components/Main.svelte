<script lang="ts">
	import Table from './Table.svelte';
	import { processData, computeChildren, copy, base64UrlEncode } from '../utils.ts';
	import type { EnhancedMetric, SingleMetric } from '$lib/types.ts';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { RowToggleEvent } from '$lib/event.ts';
	import { page } from '$app/state';

	let eventSource: EventSource | undefined = $state(undefined);
	let ip = $state('localhost');

	let enhancedMetrics: Array<EnhancedMetric> = $state([]);
	let connected = $state(2);
	let obsolete = $state(false);

	let metrics: SingleMetric[] = $state([]);

	onDestroy(() => {
		if (browser && eventSource) {
			eventSource.close();
		}
	});

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

	// setInterval(() => {
	// 	metrics.push({
	// 		id: 'test0' + Math.floor(Math.random() * 10).toString(),
	// 		parent: null,
	// 		start_end_times: [Math.random() * 10 * 1000000, Math.random() * 10 * 1000000]
	// 	});
	// 	enhancedMetrics = computeChildren(processData(metrics));
	// }, 500);

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
	let buttonLabel = $state('Copy');
	let shareDashboard = $state('Share Dashboard!');
</script>

<main>
	<button onclick={() => connect()}>Connect</button>
	<button
		onclick={() => {
			enhancedMetrics = [];
			metrics = [];
		}}>Reset</button
	>
	<button onclick={disconnect}>Disconnect</button>
	<button
		onclick={() => {
			copy(JSON.stringify(enhancedMetrics))
				.then(() => {
					buttonLabel = 'Copied!';
					setTimeout(() => {
						buttonLabel = 'Copy';
					}, 2000);
				})
				.catch((err) => {
					console.error('Failed to copy text: ', err);
				});
		}}>{buttonLabel}</button
	>
	<button
		onclick={() => {
			const data = base64UrlEncode(JSON.stringify(enhancedMetrics));
			const link = page.url + `view/${data}`;
			copy(link)
				.then(() => {
					shareDashboard = 'Link copied!';
					setTimeout(() => {
						shareDashboard = 'Share Dashboard!';
					}, 2000);
				})
				.catch((err) => {
					console.error('Failed to copy text: ', err);
				});
		}}>{shareDashboard}</button
	>
	<a href="/view">View All Dashboards</a>

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
	<Table data={enhancedMetrics} max={globalMax} min={globalMin} />

	<pre>
    <!-- {JSON.stringify(computeChildren(enhancedMetrics), null, 2)} -->
  </pre>
</main>

<style>
</style>
