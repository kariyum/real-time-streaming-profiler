export class RowToggleEvent {
    private static instance: RowToggleEvent;
    private onToggleOn: (() => void)[] = [];
    private onToggleOff: (() => void)[] = [];

    private constructor() {
    }

    public static getInstance(): RowToggleEvent {
        if (!RowToggleEvent.instance) {
            RowToggleEvent.instance = new RowToggleEvent();
        }
        return RowToggleEvent.instance;
    }

    public subscribeToggleOn(handler: () => void) {
        this.onToggleOn.push(handler);
        return () => {
            this.onToggleOn = this.onToggleOn.filter((h) => h != handler);
        }
    }

    public subscribeToggleOff(handler: () => void) {
        this.onToggleOff.push(handler);
        return () => {
            this.onToggleOff = this.onToggleOff.filter((h) => h != handler);
        }
    }

    public toggleOn() {
        this.onToggleOn.map((handler) => handler());
    }

    public toggleOff() {
        this.onToggleOff.map((handler) => handler());
    }
}