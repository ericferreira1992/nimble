import { Injectable } from "../inject/injectable";
import { ListenersCollector } from "../providers/listeners-collector";

@Injectable()
export class Renderer {
    constructor(
        private listenersCollector: ListenersCollector
    ) {}

    public listen(target: HTMLElement, eventName: string, callback: (e?: any) => void): () => void {
        return this.listenersCollector.subscribe(target, eventName, callback);
    }
}