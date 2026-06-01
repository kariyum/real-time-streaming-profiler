class EventStreamState {
	ip = $state('localhost:8080');
	connected = $state(2);
	#eventSource: EventSource | undefined = $state();

	connect = () => {
		if (this.#eventSource) {
			this.#eventSource.close();
			console.log('Closing last connection.');
		}

		let url = this.ip.trim();
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'http://' + url;
		}
		if (!url.includes(':') && !url.slice(8).includes('/')) {
			url = url + ':8080';
		}
		if (!url.endsWith('/subscribe')) {
			url = url.replace(/\/$/, '') + '/subscribe';
		}

		console.log('Connecting to SSE at:', url);
		this.#eventSource = new EventSource(url);

		this.#eventSource.onerror = (event: Event) => {
			this.connected = 3;
			console.log('SSE connection error:', event);
		};
		this.#eventSource.onopen = (event: Event) => {
			this.connected = 1;
			console.log('SSE connection opened:', event);
		};
		this.#eventSource.onmessage = (event) => {
			if (this.#eventSource) {
				this.connected = this.#eventSource.readyState;
				if (event.data) {
					const data = JSON.parse(event.data);
				}
			}
		};
	};

	disconnect = () => {
		if (this.connected === 1 && this.#eventSource) {
			this.#eventSource.close();
			this.connected = this.#eventSource.readyState;
			this.#eventSource = undefined;
		}
	};
}

export const eventStreamState = new EventStreamState();
