import type { EnhancedMetric, DiffMetric, DiffResult, DeltaMetrics, DiffStatus } from './types';

const THRESHOLD_PCT = 1;

function makeKey(metric: EnhancedMetric): string {
	return `${metric.feederId}-${metric.fnId}`;
}

function flattenTree(metrics: EnhancedMetric[]): Map<string, EnhancedMetric> {
	const map = new Map<string, EnhancedMetric>();
	function traverse(nodes: EnhancedMetric[]) {
		for (const node of nodes) {
			map.set(makeKey(node), node);
			if (node.children.length > 0) {
				traverse(node.children);
			}
		}
	}
	traverse(metrics);
	return map;
}

function computeDelta(baseline: EnhancedMetric, comparison: EnhancedMetric): DeltaMetrics {
	const cpuTime = comparison.cpuTime - baseline.cpuTime;
	const cpuTimePct = baseline.cpuTime !== 0 ? (cpuTime / baseline.cpuTime) * 100 : 0;
	const average = comparison.average - baseline.average;
	const averagePct = baseline.average !== 0 ? (average / baseline.average) * 100 : 0;
	const nbCalls = comparison.nbCalls - baseline.nbCalls;
	const nbCallsPct = baseline.nbCalls !== 0 ? (nbCalls / baseline.nbCalls) * 100 : 0;
	const selfTime = comparison.selfTime - baseline.selfTime;
	const selfTimePct = baseline.selfTime !== 0 ? (selfTime / baseline.selfTime) * 100 : 0;

	return {
		cpuTime,
		cpuTimePct,
		average,
		averagePct,
		nbCalls,
		nbCallsPct,
		selfTime,
		selfTimePct
	};
}

function determineStatus(delta: DeltaMetrics): DiffStatus {
	if (Math.abs(delta.cpuTimePct) <= THRESHOLD_PCT && Math.abs(delta.averagePct) <= THRESHOLD_PCT) {
		return 'same';
	}
	return delta.cpuTimePct < 0 ? 'changed' : 'changed';
}

function buildDiffTree(
	baselineMap: Map<string, EnhancedMetric>,
	comparisonMap: Map<string, EnhancedMetric>,
	baselineRoots: EnhancedMetric[]
): DiffMetric[] {
	const result: DiffMetric[] = [];
	const processed = new Set<string>();

	function buildNode(baselineNode: EnhancedMetric | null, comparisonNode: EnhancedMetric | null): DiffMetric {
		let status: DiffStatus;
		let delta: DeltaMetrics | null = null;
		let baselineMetric: EnhancedMetric | null = baselineNode;
		let comparisonMetric: EnhancedMetric | null = comparisonNode;

		if (baselineNode && comparisonNode) {
			delta = computeDelta(baselineNode, comparisonNode);
			status = determineStatus(delta);
			processed.add(makeKey(baselineNode));
			processed.add(makeKey(comparisonNode));
		} else if (baselineNode) {
			status = 'removed';
			processed.add(makeKey(baselineNode));
		} else {
			status = 'added';
			processed.add(makeKey(comparisonNode!));
		}

		const baselineChildren = baselineNode?.children ?? [];
		const comparisonChildren = comparisonNode?.children ?? [];

		const baselineChildMap = new Map<string, EnhancedMetric>();
		for (const c of baselineChildren) {
			baselineChildMap.set(makeKey(c), c);
		}

		const comparisonChildMap = new Map<string, EnhancedMetric>();
		for (const c of comparisonChildren) {
			comparisonChildMap.set(makeKey(c), c);
		}

		const allChildKeys = new Set([...baselineChildMap.keys(), ...comparisonChildMap.keys()]);
		const children: DiffMetric[] = [];

		for (const key of allChildKeys) {
			const bChild = baselineChildMap.get(key) ?? null;
			const cChild = comparisonChildMap.get(key) ?? null;
			children.push(buildNode(bChild, cChild));
		}

		return {
			baseline: baselineMetric,
			comparison: comparisonMetric,
			delta,
			status,
			children
		};
	}

	for (const baselineRoot of baselineRoots) {
		const key = makeKey(baselineRoot);
		const comparisonRoot = comparisonMap.get(key) ?? null;
		result.push(buildNode(baselineRoot, comparisonRoot));
	}

	for (const [key, comparisonRoot] of comparisonMap) {
		if (!processed.has(key)) {
			result.push(buildNode(null, comparisonRoot));
		}
	}

	return result;
}

function computeSummary(nodes: DiffMetric[]): DiffResult['summary'] {
	let totalFunctions = 0;
	let improved = 0;
	let regressed = 0;
	let added = 0;
	let removed = 0;

	function traverse(n: DiffMetric[]) {
		for (const node of n) {
			totalFunctions++;
			if (node.status === 'added') added++;
			else if (node.status === 'removed') removed++;
			else if (node.status === 'changed') {
				if (node.delta && node.delta.cpuTimePct < 0) improved++;
				else regressed++;
			}
			if (node.children.length > 0) {
				traverse(node.children);
			}
		}
	}

	traverse(nodes);
	return { totalFunctions, improved, regressed, added, removed };
}

export function diffTrees(baseline: EnhancedMetric[], comparison: EnhancedMetric[]): DiffResult {
	const baselineMap = flattenTree(baseline);
	const comparisonMap = flattenTree(comparison);
	const rootNodes = buildDiffTree(baselineMap, comparisonMap, baseline);
	const summary = computeSummary(rootNodes);
	return { rootNodes, summary };
}