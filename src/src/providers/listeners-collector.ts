import { Injectable } from "../inject/injectable";

@Injectable({ single: true })
export class ListenersCollector {
    private listenersSubscribed: ListenerSubscribed[] = [];

    public subscribe(target: HTMLElement, eventName: string, callback: (e?: any) => void): () => void {
        if (target) {
            let subscribed = new ListenerSubscribed({ target, eventName, callback });
            subscribed.target.addEventListener(subscribed.eventName, subscribed.callback);
            this.listenersSubscribed.push(subscribed);
            return () => this.unsubscribe(subscribed);
        }
        return () => {};
    }

    public unsubscribe(subscribed: ListenerSubscribed) {
        if (subscribed) {
            subscribed.target.removeEventListener(subscribed.eventName, subscribed.callback);
        }
        this.listenersSubscribed = this.listenersSubscribed.filter(x => x === subscribed);
    }

    public unsubscribeAll(){
        let toUnsubscribe = this.listenersSubscribed.pop();
        while(toUnsubscribe){
            if (toUnsubscribe.target)
                toUnsubscribe.target.removeEventListener(toUnsubscribe.eventName, toUnsubscribe.callback);
            
            toUnsubscribe = this.listenersSubscribed.pop();
        }
    }

    public unsubscribeAllFromElement(target: HTMLElement) {
        if (target) {
            let listToUnsubscribe  = this.listenersSubscribed.filter(x => x.target === target);
            if (listToUnsubscribe.length) {
                for(let toUnsubscribe of listToUnsubscribe) {
                    if (toUnsubscribe.target)
                        toUnsubscribe.target.removeEventListener(toUnsubscribe.eventName, toUnsubscribe.callback);
                }
                this.listenersSubscribed = this.listenersSubscribed.filter(x => !listToUnsubscribe.some(y => x === y));
            }
        }
    }

}

export class ListenerSubscribed {
    public target: HTMLElement;
    public eventName: string;
    public callback: (e: any) => void;

    constructor(obj: Partial<ListenerSubscribed>) {
        Object.assign(this, obj);
    }
}