import { Injectable } from "../inject/injectable";
import { ListenersCollector } from "../providers/listeners-collector";

@Injectable()
export class Listener {
    constructor(
        private listenersCollector: ListenersCollector
    ) {}

    public listen(target: any, eventName: string, callback: (e?: any) => void, options?: AddEventListenerOptions): () => void {
        return this.listenersCollector.subscribe(target, eventName, callback, false, options);
    }
}