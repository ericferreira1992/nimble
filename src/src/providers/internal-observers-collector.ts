import { Injectable } from "../inject/injectable";
import { ObserverListener } from "../core/observer";
import { IScope } from "../page/interfaces/scope.interface";

@Injectable({ single: true })
export class InternalObserversCollector {
    private subscribedEvents: { scope: IScope, selector: string, subscription: ObserverListener<any> }[] = [];

    public add(scope: IScope, selector: string , subscription: ObserverListener<any>) {
        this.subscribedEvents.push({
            scope: scope, selector: selector, subscription: subscription
        });
    }

    public cancelAll() {
        let subscribedEvent = this.subscribedEvents.pop();
        while(subscribedEvent) {
            subscribedEvent.subscription.unsubscribe();
            subscribedEvent = this.subscribedEvents.pop();
        }
    }

    public cancelByScope(scope: IScope) {
        let subscribedEvents = this.subscribedEvents.filter(x => x.scope === scope);
        if (subscribedEvents.length) {
            for(let subscribedEvent of subscribedEvents)
                subscribedEvent.subscription.unsubscribe();
    
            this.subscribedEvents = this.subscribedEvents.filter(x => !subscribedEvents.some(y => y === x));
        }
    }

    public cancelByScopeAndSelector(scope: IScope, selector: string) {
        let subscribedEvents = this.subscribedEvents.filter(x => x.selector === selector && x.scope === scope);
        if (subscribedEvents.length) {
            for(let subscribedEvent of subscribedEvents)
                subscribedEvent.subscription.unsubscribe();
    
            this.subscribedEvents = this.subscribedEvents.filter(x => !subscribedEvents.some(y => y === x));
        }
    }
}