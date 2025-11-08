import type { EnhancedMetric, Metric, SingleMetric } from "./types";

function computeAverage(times_arr: number[]): number {
    return times_arr.reduce((a, b) => a + b) / times_arr.length;
}

function computeMin(times_arr: number[]): number {
    return times_arr.reduce((a, b) => (a < b ? a : b));
}

function computeMax(times_arr: number[]): number {
    return times_arr.reduce((a, b) => (a < b ? b : a));
}

function computeNbCalls(arr: number[]): number {
    return arr.length;
}

function computeCpuTime(start_end_times: number[][]): number {
    const sortedTimes = start_end_times.sort((a, b) => a[0] - b[0]);

    let total = 0;
    let count = 0;
    let currentEnd = sortedTimes[0][1];

    for (let i = 0; i < sortedTimes.length; i++) {
        const [start, end] = sortedTimes[i];

        if (start > currentEnd) {
            total += currentEnd - sortedTimes[count][0];
            count = i;
        }

        currentEnd = Math.max(currentEnd, end);
    }

    total += currentEnd - sortedTimes[count][0];
    // const average = total / sortedTimes.length;

    return total;
}

function sortByAverage(enchantedMetrics: EnhancedMetric[]): EnhancedMetric[] {
    return enchantedMetrics.sort((a, b) => b.average - a.average);
}

function copyEnhancedMetric(enhancedMetric: EnhancedMetric): EnhancedMetric {
    return {
        ...enhancedMetric,
        children: enhancedMetric.children.map((m) => copyEnhancedMetric(m))
    } as EnhancedMetric;
}

export function computeChildren(array: EnhancedMetric[]): EnhancedMetric[] {
    const difference = (a: Set<string | null>, b: Set<string | null>) => new Set([...a].filter((x) => !b.has(x)));
    let arr = array.slice().map(copyEnhancedMetric);
    let tree = [];
    let lookup: Map<string, EnhancedMetric> = new Map();

    const parents = new Set(
        arr.map((a) => a.parent).filter((a) => a !== null),
    );
    const functionNameClasses = new Set(
        arr.map((a) => a.id),
    );
    for (const it of difference(parents, functionNameClasses)) {
        arr.push({
            id: it!,
            parent: null,
            average: 0,
            min: 0,
            max: 0,
            nbCalls: 0,
            cpu_time: 0,
            children: []
        });
    }

    for (let i = 0; i < arr.length; i++) {
        lookup.set(arr[i].id, arr[i]);
        arr[i].children = [];
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i].parent) {
            lookup.get(arr[i].parent!)!.children.push(arr[i]);
        } else {
            tree.push(arr[i]);
        }
    }
    return tree;
}

function enhanceData(metrics: Metric[]): EnhancedMetric[] {
    const enhancedData = metrics.map((metric) => {
        const durationArray = metric.start_end_times.map(([a, b]) => b - a);
        const newMetric = {
            id: metric.id,
            parent: metric.parent,
            average: computeAverage(durationArray),
            min: computeMin(durationArray),
            max: computeMax(durationArray),
            cpu_time: computeCpuTime(metric.start_end_times),
            nbCalls: computeNbCalls(durationArray),
            children: [],
        };
        return newMetric;
    });
    return enhancedData;
}

function groupSingleMetricsIntoMetric(metrics: SingleMetric[]): Metric[] {
    const map: Map<String, Metric> = new Map();
    metrics.forEach((metric) => {
        const key = `${metric.id}-${metric.parent}`;
        if (map.has(key)) {
            // console.log("LOGGING METRIC IN GROUPSINGLE", map[key]);
            map.get(key)!.start_end_times.push(metric.start_end_times);
        } else {
            map.set(key, { ...metric, start_end_times: [metric.start_end_times] } as Metric);
        }
    });

    return Array.from(map.values());
}

function nanosSecondsToMillis(data: SingleMetric[]) {
    return data.map((singleMetric) => {
        const times = singleMetric.start_end_times.map((n) => n / 1_000_000);
        return { ...singleMetric, start_end_times: times };
    });
}

export function processData(data: SingleMetric[]) {
    const millisData = nanosSecondsToMillis(data)
    const metrics = groupSingleMetricsIntoMetric(millisData);
    const enhancedData = enhanceData(metrics);
    const sorted = sortByAverage(enhancedData);
    return sorted;
    // return computeChildren(sorted);
}