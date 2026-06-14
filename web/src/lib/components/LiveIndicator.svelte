<script lang="ts">
	import { eventStreamState } from '$lib/eventSource.svelte.ts';
</script>

<div class="live-indicator">
	<span class="dot" class:connected={eventStreamState.connected === 'open'}></span>
	<span class="label">Live: {eventStreamState.onlineFeeders.length} feeder(s), {eventStreamState.metrics.length} points</span>
</div>

<style>
	.live-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.78rem;
		color: var(--font-secondary);
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--table-border);
		background-color: var(--table-header);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--font-muted);
	}

	.dot.connected {
		background-color: var(--success);
		box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
		animation: pulse 1.6s infinite cubic-bezier(0.66, 0, 0, 1);
	}

	.label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
	}

	@keyframes pulse {
		to {
			box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
		}
	}
</style>
