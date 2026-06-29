import type { EnhancedMetric, Metric, SingleMetric, SingleMetricWithSource } from './types';

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

function sortByCPUTime(enchantedMetrics: EnhancedMetric[]): EnhancedMetric[] {
    return enchantedMetrics.sort((a, b) => b.cpuTime - a.cpuTime);
}

function copyEnhancedMetric(enhancedMetric: EnhancedMetric): EnhancedMetric {
    return {
        ...enhancedMetric,
        children: enhancedMetric.children.map((m) => copyEnhancedMetric(m))
    } as EnhancedMetric;
}

export function computeChildren(array: EnhancedMetric[]): EnhancedMetric[] {
    let arr = array.slice().map(copyEnhancedMetric);
    let tree = [];
    let lookup: Map<string, EnhancedMetric> = new Map();

    const fnsWithData = new Set(arr.map((a) => a.id));
    const missingCallers = new Map<string, EnhancedMetric>(
        arr
            .filter((a) => a.caller !== null)
            .filter((a) => !fnsWithData.has(`${a.feederId}-${a.caller}`))
            .map((a) => [`${a.feederId}-${a.caller}`, a])
    );
    for (const [callerId, fn] of missingCallers) {
        arr.push({
            id: callerId,
            fnId: fn.caller!,
            caller: null,
            average: 0,
            min: 0,
            max: 0,
            nbCalls: 0,
            cpuTime: 0,
            selfTime: 0,
            selfTimePct: 0,
            children: [],
            feederId: fn.feederId
        });
    }

    for (let i = 0; i < arr.length; i++) {
        lookup.set(arr[i].id, arr[i]);
        arr[i].children = [];
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i].caller) {
            lookup.get(`${arr[i].feederId}-${arr[i].caller!}`)!.children.push(arr[i]);
        } else {
            tree.push(arr[i]);
        }
    }

    function computeSelfTimes(nodes: EnhancedMetric[]): void {
        for (const node of nodes) {
            computeSelfTimes(node.children);
            const childSum = node.children.reduce((sum, c) => sum + c.cpuTime, 0);
            node.selfTime = node.cpuTime - childSum;
            node.selfTimePct = childSum == 0 ? 0 : ((node.cpuTime - childSum) / childSum) * 100;
        }
    }
    computeSelfTimes(tree);
    return tree;
}

function enhanceData(metrics: Metric[]): EnhancedMetric[] {
    const enhancedData = metrics.map((metric) => {
        const durationArray = metric.start_end_times.map(([a, b]) => b - a);
        const newMetric = {
            id: `${metric.feeder_id}-${metric.id}`,
            fnId: metric.id,
            caller: metric.parent,
            average: computeAverage(durationArray),
            min: computeMin(durationArray),
            max: computeMax(durationArray),
            cpuTime: computeCpuTime(metric.start_end_times),
            selfTime: 0,
            selfTimePct: 0,
            nbCalls: computeNbCalls(durationArray),
            feederId: metric.feeder_id,
            children: []
        };
        return newMetric;
    });
    return enhancedData;
}

function groupSingleMetricsIntoMetric(metrics: SingleMetricWithSource[]): Metric[] {
    const map: Map<String, Metric> = new Map();
    for (const metric of metrics) {
        const key = `${metric.feeder_id}-${metric.id}-${metric.parent}`;
        if (map.has(key)) {
            map.get(key)!.start_end_times.push(metric.start_end_times);
        } else {
            map.set(key, { ...metric, start_end_times: [metric.start_end_times] } as Metric);
        }
    }

    return Array.from(map.values());
}

function nanosSecondsToMillis(data: SingleMetricWithSource[]): SingleMetricWithSource[] {
    return data.map((singleMetric) => {
        return {
            ...singleMetric,
            start_end_times: [
                singleMetric.start_end_times[0] / 1_000_000,
                singleMetric.start_end_times[1] / 1_000_000
            ]
        };
    });
}

export function processData(data: SingleMetricWithSource[]) {
    const millisData = nanosSecondsToMillis(data);
    const metrics = groupSingleMetricsIntoMetric(millisData);
    const enhancedData = enhanceData(metrics);
    const sorted = sortByCPUTime(enhancedData);
    return sorted;
    // return computeChildren(sorted);
}

export function base64UrlEncode(str: string) {
    const utf8Bytes = new TextEncoder().encode(str);
    const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));

    return base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode<T>(base64UrlData: string): T {
    let base64String = base64UrlData.replace(/-/g, '+').replace(/_/g, '/');

    while (base64String.length % 4) {
        base64String += '=';
    }

    let jsonStringWithUnicode: string;
    try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        jsonStringWithUnicode = new TextDecoder().decode(bytes);
    } catch (e) {
        console.error('Failed to decode Base64URL data:', e);
        throw new Error('Invalid sharable link data format.');
    }

    return JSON.parse(jsonStringWithUnicode) as T;
}

export function copy(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
