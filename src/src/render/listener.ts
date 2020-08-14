import { Injectable } from "../inject/injectable";
import { ElementListenersCollector } from "../providers/listeners-collector";

@Injectable()
export class ElementListener {
    constructor(
        private listenersCollector: ElementListenersCollector
    ) {}

    public listen(target: any, eventName: string, callback: (e?: any) => void, options?: AddEventListenerOptions): () => void {
        return this.listenersCollector.subscribe(target, eventName, callback, false, options);
    }
}