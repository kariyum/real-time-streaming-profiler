import type { SingleMetric, SingleMetricWithSource, EnhancedMetric } from './types.ts';
import { FeederMessageSchema } from './types.ts';
import { computeChildren, processData } from './utils.ts';

type ConnectionState = 'closed' | 'open' | 'error' | 'connecting';

type Subscriber = (data: SingleMetricWithSource[]) => void;

class EventStreamState {
	ip = $state('localhost:8080');
	#eventSource: EventSource | undefined = $state();
	connected: ConnectionState = $state('closed');
	#subs: Subscriber[] = [];
	#onresetSubs: (() => void)[] = [];
	metrics: SingleMetricWithSource[] = $state([]);
	onlineFeeders: { id: string; name: string }[] = $state([]);

	connect = () => {
		if (this.#eventSource) {
			this.#eventSource.close();
			this.#eventSource = undefined;
		}

		let url = this.ip.trim();
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'http://' + url;
		}

		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			console.error('Invalid URL:', url);
			return;
		}

		if (!parsed.port) {
			parsed.port = '8080';
		}
		if (!parsed.pathname.endsWith('/subscribe')) {
			parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/subscribe';
		}

		this.connected = 'connecting';
		this.#eventSource = new EventSource(parsed.toString());

		this.#eventSource.onerror = () => {
			this.connected = 'error';
			this.onlineFeeders = [];
		};
		this.#eventSource.onopen = () => {
			this.connected = 'open';
		};
		this.#eventSource.onmessage = (event: MessageEvent) => {
			if (!event.data) return;
			const result = FeederMessageSchema.safeParse(JSON.parse(event.data));
			if (!result.success) {
				console.error('Invalid SSE message:', result.error.flatten());
				return;
			}
			const data = result.data;
			if (data.type === 'observation') {
				const dataWithSource = data.msg.map((e) => {
					return { ...e, feeder_id: data.feeder_id };
				});
				this.metrics.push(...dataWithSource);
				this.#subs.forEach((f) => f(this.metrics));
			} else if (data.type === 'new_feeder') {
				if (!this.onlineFeeders.map((e) => e.id).includes(data.id)) {
					this.onlineFeeders = [...this.onlineFeeders, { name: data.name, id: data.id }];
				}
			} else if (data.type === 'rage_quit_feeder') {
				this.onlineFeeders = this.onlineFeeders.filter((n) => n.id !== data.id);
			} else if (data.type === 'online_feeders') {
				this.onlineFeeders = data.feeder_ids;
			}
		};
	};

	disconnect = () => {
		if (this.#eventSource) {
			this.#eventSource.close();
			this.onlineFeeders = [];
			this.#eventSource = undefined;
		}
		this.connected = 'closed';
	};

	subscribe = (f: Subscriber): (() => void) => {
		this.#subs.push(f);
		f(this.metrics);
		return () => {
			this.#subs = this.#subs.filter((sub) => sub !== f);
		};
	};

	destroy = () => {
		this.disconnect();
		this.#subs = [];
		this.onlineFeeders = [];
	};

	reset = () => {
		this.metrics = [];
		this.#onresetSubs.forEach((f) => f());
	};

	onreset = (f: () => void) => {
		this.#onresetSubs.push(f);
	};

	getProcessedMetrics = (): EnhancedMetric[] => {
		return computeChildren(processData(this.metrics));
	};
}

export const eventStreamState = new EventStreamState();
