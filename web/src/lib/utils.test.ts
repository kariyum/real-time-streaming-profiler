import { describe, it, expect } from 'vitest';
import { computeChildren, processData } from './utils';
import type { EnhancedMetric, SingleMetricWithSource } from './types';

// Nanosecond timestamps used by the real SSE stream
const NS = 1_000_000; // 1ms in nanoseconds

function makeMetric(
	id: string,
	parent: string | null,
	feederId: string,
	startEndTimes: [number, number][]
): SingleMetricWithSource[] {
	return startEndTimes.map(([s, e]) => ({
		id,
		parent,
		feeder_id: feederId,
		start_end_times: [s, e] as [number, number]
	}));
}

// Helpers to build EnhancedMetric directly for computeChildren unit tests
function em(
	feederId: string,
	fnId: string,
	caller: string | null,
	extra: Partial<EnhancedMetric> = {}
): EnhancedMetric {
	return {
		id: `${feederId}-${fnId}`,
		fnId,
		caller,
		average: 1,
		min: 1,
		max: 1,
		nbCalls: 1,
		cpuTime: 1,
		selfTime: 0,
		selfTimePct: 0,
		children: [],
		feederId,
		...extra
	};
}

describe('computeChildren', () => {
	it('produces unique root ids when two siblings share a missing caller', () => {
		// Reproduces the bug: fetchMaps and optimizer both call "_compute",
		// which has no EnhancedMetric of its own.
		const input: EnhancedMetric[] = [
			em('feeder', 'alpha', 'parent'),
			em('feeder', 'beta', 'parent'),
			em('feeder', 'gamma', 'root')
		];

		const tree = computeChildren(input);

		const ids = tree.map((n) => n.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length); // no duplicate keys
	});

	it('places both siblings under the single synthesised caller node', () => {
		const input: EnhancedMetric[] = [
			em('feeder', 'alpha', 'parent'),
			em('feeder', 'beta', 'parent')
		];

		const tree = computeChildren(input);

		expect(tree).toHaveLength(1);
		const root = tree[0];
		expect(root.fnId).toBe('parent');
		const childIds = root.children.map((c) => c.fnId).sort();
		expect(childIds).toEqual(['alpha', 'beta']);
	});

	it('handles a single root with no missing caller', () => {
		const input: EnhancedMetric[] = [
			em('feeder', 'root', null),
			em('feeder', 'leaf', 'root')
		];

		const tree = computeChildren(input);

		expect(tree).toHaveLength(1);
		expect(tree[0].fnId).toBe('root');
		expect(tree[0].children).toHaveLength(1);
		expect(tree[0].children[0].fnId).toBe('leaf');
	});

	it('isolates nodes across different feeders with the same function name', () => {
		const input: EnhancedMetric[] = [
			em('feeder-a', 'worker', 'dispatcher'),
			em('feeder-b', 'worker', 'dispatcher')
		];

		const tree = computeChildren(input);

		const ids = tree.map((n) => n.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
		expect(ids).toContain('feeder-a-dispatcher');
		expect(ids).toContain('feeder-b-dispatcher');
	});
});

describe('processData (integration)', () => {
	it('reproduces the real stream shape without duplicate ids', () => {
		// Two siblings (alpha, beta) share a caller (gamma) that has no own data.
		// gamma itself is called by delta. All from the same feeder.
		const alpha = makeMetric(
			'alpha',
			'gamma',
			'feeder',
			Array.from({ length: 70 }, (_, i) => [i * 2 * NS, (i * 2 + 1) * NS] as [number, number])
		);
		const beta = makeMetric('beta', 'gamma', 'feeder', [[0, 5 * NS]]);
		const gamma = makeMetric('gamma', 'delta', 'feeder', [[0, 200 * NS]]);

		const all: SingleMetricWithSource[] = [...alpha, ...beta, ...gamma];
		const tree = computeChildren(processData(all));

		const allNodes: EnhancedMetric[] = [];
		function collect(nodes: EnhancedMetric[]) {
			for (const n of nodes) {
				allNodes.push(n);
				collect(n.children);
			}
		}
		collect(tree);

		const ids = allNodes.map((n) => n.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it('groups repeated observations into a single metric entry', () => {
		const metrics = makeMetric('alpha', null, 'feeder', [
			[0, 10 * NS],
			[20 * NS, 30 * NS],
			[40 * NS, 50 * NS]
		]);

		const result = processData(metrics);

		expect(result).toHaveLength(1);
		expect(result[0].nbCalls).toBe(3);
	});
});
