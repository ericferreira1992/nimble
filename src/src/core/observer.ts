export class Observer<T> {

    private listeners: ObserverListener<T>[] = [];

    constructor() {

    }

    public notify(value: any) {
        for(let listener of this.listeners) {
            if (listener.success)
                listener.success(value);
        }
    }

    public error(error: any) {
        for(let listener of this.listeners) {
            if (listener.error)
                listener.error(error);
        }
    }

    public subscribe(success?: (value: T) => void, error?: (error: any) => void): ObserverListener<T> {
        let listener = new ObserverListener<T>(success, error, this);
        this.listeners.push(listener);
        return listener;
    }

    public unsubscribe(listener: ObserverListener<T>) {
        this.listeners = this.listeners.filter(x => x !== listener);
    }
}

export class ObserverListener<T>{
    public success: (value: T) => void;
    public error: (error: any) => void;

    private observer: Observer<T>;

    constructor(success: (value: T) => void, error: (error: any) => void, observer: Observer<T>) {
        this.success = success;
        this.error = error;
        this.observer = observer;
    }

    public unsubscribe() {
        if (this.observer)
            this.observer.unsubscribe(this);
    }
}