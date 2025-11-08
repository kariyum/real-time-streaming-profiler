export type SingleMetric = {
    id: string;
    parent: string | null;
    start_end_times: number[];
}

export type Metric = {
    id: string;
    parent: string | null;
    start_end_times: number[][];
}

export type EnhancedMetric = {
    id: string;
    parent: string | null;
    average: number;
    min: number;
    max: number;
    nbCalls: number;
    cpu_time: number;
    children: EnhancedMetric[]
}