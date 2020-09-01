import { Injectable } from "../inject/injectable";

@Injectable({ single: true })
export class ElementListenersCollector {
    private listenersSubscribed: ListenerSubscribed[] = [];

    public subscribe(target: HTMLElement, eventName: string, callback: (e?: any) => void, internal: boolean = false, options?: AddEventListenerOptions): () => void {
        if (target) {
            let subscribed = new ListenerSubscribed({
                internal,
                target,
                eventName,
                realCallback: callback,
				options,
				applied: true
            });
            subscribed.callback = (e) => {
                if (subscribed.beforeListen) subscribed.beforeListen.forEach(x => x());
				callback(e);
                if (subscribed.afterListen) subscribed.afterListen.forEach(x => x());
            }
			this.listenersSubscribed.push(subscribed);
			
            subscribed.target.addEventListener(subscribed.eventName, subscribed.callback, subscribed.options);
            
            return () => this.unsubscribe(subscribed);
        }
        return () => {};
    }

    private getSubscribersByTarget(target: HTMLElement) {
        return this.listenersSubscribed.filter(x => x.target === target);
    }

    public getSubscribedsByTargetAndEventName(target: HTMLElement, eventName: string) {
        return this.listenersSubscribed.filter(x => x.target === target && x.eventName === eventName);
    }

    public unsubscribe(subscribed: ListenerSubscribed) {
        if (subscribed && subscribed.applied) {
            subscribed.target.removeEventListener(subscribed.eventName, subscribed.callback);
        }
        this.listenersSubscribed = this.listenersSubscribed.filter(x => x !== subscribed);
    }

    public unsubscribeAll(){
        let toUnsubscribe = this.listenersSubscribed.pop();
        while(toUnsubscribe){
            if (toUnsubscribe.target && toUnsubscribe.applied)
                toUnsubscribe.target.removeEventListener(toUnsubscribe.eventName, toUnsubscribe.callback);
            
            toUnsubscribe = this.listenersSubscribed.pop();
        }
    }

    public unsubscribeAllFromElement(target: HTMLElement) {
        if (target) {
            let listToUnsubscribe  = this.listenersSubscribed.filter(x => x.target === target);
            if (listToUnsubscribe.length) {
                for(let toUnsubscribe of listToUnsubscribe) {
                    if (toUnsubscribe.target && toUnsubscribe.applied){
                        toUnsubscribe.target.removeEventListener(toUnsubscribe.eventName, toUnsubscribe.callback);
                    }
                }
                this.listenersSubscribed = this.listenersSubscribed.filter(x => !listToUnsubscribe.some(y => x === y));
            }
        }
    }

    public addActionsInElementsListeners(element: HTMLElement, before: () => void, after: () => void) {
        if (before || after) {
            for (let subscribed of this.getSubscribersByTarget(element)) {
				if (!subscribed.beforeListen.some(x => x === before))
                    subscribed.beforeListen.push(before);
                if (!subscribed.afterListen.some(x => x === after))
                    subscribed.afterListen.push(after);
			}
        }
    }
}

export class ListenerSubscribed {
    public internal: boolean;
    public target: HTMLElement;
    public eventName: string;
    public callback: (e: any) => void;
    public realCallback: (e: any) => void;
    public options: AddEventListenerOptions;
    public applied: boolean = false

    beforeListen: (() => void)[] = [];
    afterListen: (() => void)[] = [];

    constructor(obj: Partial<ListenerSubscribed>) {
        Object.assign(this, obj);
    }
}