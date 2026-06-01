import type { SingleMetric } from './types.ts';
import { MetricsArraySchema } from './types.ts';

type ConnectionState = 'closed' | 'open' | 'error' | 'connecting';

type Subscriber = (data: SingleMetric[]) => void;

class EventStreamState {
	ip = $state('localhost:8080');
	#eventSource: EventSource | undefined = $state();
	connected: ConnectionState = $state('closed');
	#subs: Subscriber[] = [];

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
		};
		this.#eventSource.onopen = () => {
			this.connected = 'open';
		};
		this.#eventSource.onmessage = (event: MessageEvent) => {
			if (event.data) {
				const result = MetricsArraySchema.safeParse(JSON.parse(event.data));
				if (result.success) {
					this.#subs.forEach(f => f(result.data));
				} else {
					console.error('Invalid SSE data:', result.error.flatten());
				}
			}
		};
	};

	disconnect = () => {
		if (this.#eventSource) {
			this.#eventSource.close();
			this.#eventSource = undefined;
		}
		this.connected = 'closed';
	};

	subscribe = (f: Subscriber): (() => void) => {
		this.#subs.push(f);
		return () => {
			this.#subs = this.#subs.filter(sub => sub !== f);
		};
	};

	destroy = () => {
		this.disconnect();
		this.#subs = [];
	};
}

export const eventStreamState = new EventStreamState();
