import { Route } from './route';
import { isNullOrUndefined, isArray } from 'util';
import { RouteBase } from './route-base';
import { NimbleApp, NimbleAppState } from '../app';
import { Page } from '../page/page';
import { RouterEvent } from './router-event.enum';
import { RouterEventType } from './router-event-type.enum';

export class Router {
    public static get app() { return NimbleApp.instance; }

    private static _routes: Route[] = [];
    private static _current: Route;
    private static _next: Route;
    private static _previous: Route;

    private static _state: RouterEvent;
    public static get state() { return this._state; };

    private static _previousState: RouterEvent;
    public static get previousState() { return this._previousState; };

    private static lastLocationPath: string;
    private static stopListening: boolean = false;

    private static listeners: { type: RouterEvent, callback: (route?: any) => void, internal: boolean }[] = [];

    public static useHash: boolean = false;

    public static _nextPath: string = null;

    private static nextRejectedAndRedirectAfter: boolean = false;

    private static get realCurrentPath() { return (this.useHash ? location.hash : location.pathname).replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, ''); }
    public static get currentPath() { return (!isNullOrUndefined(this.nextPath) ? this.nextPath : (this.useHash ? location.hash : location.pathname)).replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, ''); }
    public static get nextPath() { return this._nextPath; }

    public static get routes() { return this._routes; }
    public static get abstractRoutes() { return this._routes.filter(x => x.isAbstract); }
    public static get singleRoutes() { return this._routes.filter(x => !x.isAbstract); }
    public static get current() { return this._current; }
    public static get next() { return this._next; }
    public static get previous() { return this._previous; }

    public static get onRoute() { return !isNullOrUndefined(this._current); }

    public static get rerenderedBeforeFinishedRouteChange() { return this.previousState === RouterEvent.FINISHED_RERENDER || this.previousState === RouterEvent.STARTED_RERENDER; }

    public static registerRoutes(routes: RouteBase[]) {
        if (this.app.state === NimbleAppState.INITIALIZING) {
            this._routes = routes.map(routeBase => new Route(routeBase));
        }
    }

    private static setState(state: RouterEvent, senderNotify?: any, silentMode: boolean = false) {
        this._previousState = this._state;
        this._state = state;
        if (!silentMode) this.notifyListeners(state, senderNotify);
    }

    public static start() {
        if (this.app.state === NimbleAppState.INITIALIZING) {
            this.startListening();
        }
    }

    /**
     * Adds a listener for when the routing state changes.
     * Also it returns a void function to cancel listen when want. 
     * @param types 
     * @param callback 
     */
    public static addListener(types: RouterEvent | RouterEvent[], callback: () => void) {
        types = !isArray(types) ? [types] : types;
        let listeners = [];
        for(let type of types) {
            let listener = { type: type, callback, internal: this.app.state === NimbleAppState.INITIALIZING };
            listeners.push(listener);
            this.listeners.push(listener);
        }
        return () => {
            this.listeners = this.listeners.filter(x => !listeners.some(y => x === y));
        };
    }

    private static startListening() {
        this.stopListening = false;
        setTimeout(() => this.listen(), 200);
    }

    private static notifyListeners(event: RouterEvent, sender?: any) {
        let listeners = this.listeners.filter(x => x.type === event);

        if (this.getEventType() === RouterEventType.START)
            listeners = listeners.sort((a,b) => {
                let internalA = a.internal;
                let internalB = b.internal;
                return (internalA === internalB)? 0 : (internalA ? -1 : 1);
            });
        else
            listeners = listeners.sort((a,b) => {
                let internalA = a.internal;
                let internalB = b.internal;
                return (internalA === internalB)? 0 : (internalA ? 1 : -1);
            });
        
        listeners.forEach((listener) => listener.callback(sender));
    }

    private static listen() {
        if (!this.stopListening) {
            try {
                if (!this.onRoute || this.currentPath !== this.lastLocationPath) {
                    if (isNullOrUndefined(this.nextPath)){ 
                        this.lastLocationPath = this.currentPath;
                    }
    
                    let changed = false;
                    if (this.checkPageCanBeCurrent()) {
                        changed = this.defineCurrentPage();
                    }
                    this.onRouterChange(changed);
                }
            }
            finally {
                setTimeout(this.listen.bind(this), 200);
            }
        }
    }

    private static checkPageCanBeCurrent(): boolean {
        let found = this.routes.some((route, index) => {
            if (route.checkIfMatchCurrentLocation())
                return true;
            else if (index < ((this.routes.length - 1)) && !this.routes.slice(index + 1).some(x => x.path === route.path))
                return route.checkIfMatchCurrentLocation(true);
            return false;
        });

        if (!found) {
            return this.routes.some((route, index) => {
                if (route.checkIfMatchCurrentLocation(true))
                    return true;
                return false;
            });
        }
        return true;
    }

    private static defineCurrentPage(): boolean {
        let newRoute = null;

        // Find the matched route path or get priority route path
        if (!newRoute) {
            for (let i = 0; i < this.routes.length; i++) {
                let route = this.routes[i];
                newRoute = route.getMatchedPageWithLocation();

                if (newRoute) {
                    break;
                }
                // Check if there is another route ahead with the same path as the current one.
                else if(i < ((this.routes.length - 1)) && !this.routes.slice(i + 1).some(x => x.path === route.path)) {
                    newRoute = route.getMatchedPageWithLocation(true);
                    if (newRoute)
                        break;
                }
            }
        }

        // If cannot get some route above, take the first one setted as priority
        if (!newRoute) {
            for (let i = 0; i < this.routes.length; i++) {
                let route = this.routes[i];
                newRoute = route.getMatchedPageWithLocation(true);

                if (newRoute)
                    break;
            }
        }

        if (newRoute !== this.current) {
            this._next = newRoute;
            return true;
        }

        return false;
    }

    private static onRouterChange(changedPage: boolean) {
        if (changedPage && this.next) {
            if (!this.next.isPriority || this.next.completePath() === this.currentPath) {
                this.loadCurrentRoutePage();
            }
            else {
                this.redirect(this.next.completePath());
                this._next = null;
            }
        }
        else if (!this.next) {
            console.error(`No pages matched with this path: "/${this.currentPath}". If it path is abstract (has children), set one child as 'isPriority: true' in "routes.ts".`);
            this._next = null;
            this.stopListening = true;
        }
    }

    private static loadCurrentRoutePage() {
        this.setState(RouterEvent.START_CHANGE, this.next);

        if (this.next.hasParent)
            this.loadRoutesPageFromAllParents();
        else
            this.loadRoutePage(this.next).then(
                () => {
                    this.defineCurrentAfterFinished();
                    this.setState(RouterEvent.FINISHED_CHANGE, this.current);
                },
                () => {
                    this.abortChangeRoute();
                    this.setState(RouterEvent.CHANGE_ERROR, this.current)
                },
            );
    }

    private static loadRoutesPageFromAllParents() {
        let commonParentRoute = this.current ? Router.getCommonParentOfTwoRoutes(this.next, this.current) : null;
        let parents = this.next.getAllParents().map((parentRoute) => ({
            route: parentRoute,
            makeNewInstance: true
        }));

        if (commonParentRoute) {
            for(let parent of parents.reverse()) {
                parent.makeNewInstance = false;
                if (parent.route === commonParentRoute)
                    break;
            }
        }

        let action = () => {
            if (parents.length > 0) {
                let parent = parents.pop();
                this.loadRoutePage(parent.route, parent.makeNewInstance).then(
                    () => {
                        action();
                    },
                    (error) => {
                        this.abortChangeRoute();
                        this.setState(RouterEvent.COMPLETED_LOADING);
                        this.setState(RouterEvent.ERROR_LOADING, error);
                    }
                );
            }
            else{
                this.loadRoutePage(this.next).then(
                    () => {
                        this.defineCurrentAfterFinished();
                        this.setState(RouterEvent.FINISHED_CHANGE, this.current);
                    },
                    () => {
                        this.abortChangeRoute();
                        this.setState(RouterEvent.CHANGE_ERROR, this.current)
                    },
                );
            }
        }

        action();
    }

    private static defineCurrentAfterFinished() {
        if (this._current)
            this._previous = this._current;
    
        if (this.next) {
            this._current = this.next;
            this._next = null;
        }

        if (!isNullOrUndefined(this._nextPath)) {
            this.updateURLPath(this._nextPath);
            this._nextPath = null;
        }
        
        this.lastLocationPath = this.currentPath;
        this.notifyOldRoutesElementExit();
    }

    private static abortChangeRoute() {
        if(!isNullOrUndefined(this.nextPath) && !this.nextRejectedAndRedirectAfter && this.current) {
            let currentPath = this.nextPath;
            this._next = null;
            this._nextPath = null;
            
            this.updateURLPath(currentPath);
            this.lastLocationPath = this.currentPath;
        }
        else if (isNullOrUndefined(this.nextPath) && !this.nextRejectedAndRedirectAfter) {
            console.error(`Page of path "/${this.currentPath}" was rejected. In this case, there is no previous route for us can to return to, we suggest that you do some "Router.redirect('/you-secured-path')" in your ActivatedRoute class for these cases.`);
            this._next = null;
            this.stopListening = true;
        }
    }

    private static updateURLPath(path: string) {
        path = (path.startsWith('/') ? '' : '/') + path;
        if (this.useHash) 
            location.hash = path;
        else
            history.pushState(null, null, path);
    }

    private static loadRoutePage(route: Route, makeNewInstacePage: boolean = true, silentMode: boolean = false, notifyStart: boolean = true) {
        return new Promise<Route>((resolve, reject) => {
            this.setState(RouterEvent.STARTED_LOADING, route, silentMode || notifyStart);
            
            route.loadPage(
                (route: Route) => {
                    if (this.routeCanActivate(route)) {
                        route.pageInstance.onNeedRerender = this.whenRerenderIsRequested.bind(this);
                        route.pageInstance.pageParent = route.parent ? route.parent.pageInstance : null;
                        route.pageInstance.onEnter();
                        this.setState(RouterEvent.FINISHED_LOADING, route, silentMode);
                        resolve(route);
                    }
                    else{
                        this.setState(RouterEvent.CHANGE_REJECTED, route, silentMode);
                        reject(null);
                    }
                },
                (error) => {
                    console.error(error);
                    this.setState(RouterEvent.ERROR_LOADING, error, silentMode);
                    reject(error);
                },
                () => {
                    this.setState(RouterEvent.COMPLETED_LOADING, null, silentMode);
                },
                makeNewInstacePage
            );
        });
    }

    private static routeCanActivate(route: Route) {
        let currentPath = (this.realCurrentPath.startsWith('/') ? '' : '/') + this.realCurrentPath;
        let nextPath = this.nextPath ? ((this.nextPath.startsWith('/') ? '' : '/') + this.nextPath) : currentPath;

        if (route.routeActivate && route.routeActivate.length > 0) {
            for(let routeActivate of route.routeActivate) {
                let instance = NimbleApp.inject(routeActivate);
                if (instance && !instance.doActivate(currentPath, nextPath, route))
                    return false;
            }
        }
        return true;
    }

    public static redirect(route: string) {
        this.nextRejectedAndRedirectAfter = isNullOrUndefined(this.nextPath) ? false : true;
        if (this.nextRejectedAndRedirectAfter && isNullOrUndefined(this.current)) {
            this.updateURLPath(route);
        }
        this._nextPath = route;
    }

    private static notifyOldRoutesElementExit() {
        let highestParentRoute = this.current.getHighestParentOrHimself();
        let commonParentRoute = this.previous ? Router.getCommonParentOfTwoRoutes(this.current, this.previous) : highestParentRoute;
        
        if (this.previous) {
            let onlyOldRoutes: Route[] = [];

            for(let route of [this.previous, ...this.previous.getAllParents()]) {
                if (route === commonParentRoute)
                    break;
                onlyOldRoutes.push(route);
            }

            onlyOldRoutes.reverse().forEach((route) => {
                route.pageInstance.onExit();
            });
        }
    }

    private static whenRerenderIsRequested(page: Page) {
        let changingRouteInProgress = this.state === RouterEvent.START_CHANGE;
        let routeChangeFinished = this.state === RouterEvent.FINISHED_CHANGE;
        
        this.setState(RouterEvent.STARTED_RERENDER, (changingRouteInProgress && this.previous) ? this.previous : this.current);

        if (!routeChangeFinished || this.state === RouterEvent.STARTED_RERENDER)
            this.setState(RouterEvent.FINISHED_RERENDER, this.current);

        if (changingRouteInProgress)
            this._state = RouterEvent.START_CHANGE;
    }

    public static getCommonParentOfTwoRoutes(routeA: Route, routeB: Route): Route {
        if (routeA && routeB) {
            let allRoutesA = [routeA, ...routeA.getAllParents()];
            let allRoutesB = [routeB, ...routeB.getAllParents()];

            let commonParent = allRoutesA.find(routeA => allRoutesB.some(routeB => routeA === routeB));
            return commonParent;
        }
        return null;
    }

    private static getEventType(state?: RouterEvent) {
        state = state ? state : this.state;
        switch(state) {
            case RouterEvent.START_CHANGE:
            case RouterEvent.STARTED_LOADING:
            case RouterEvent.STARTED_RERENDER:
                return RouterEventType.START

            case RouterEvent.FINISHED_CHANGE:
            case RouterEvent.FINISHED_LOADING:
            case RouterEvent.COMPLETED_LOADING:
            case RouterEvent.ERROR_LOADING:
            case RouterEvent.FINISHED_RERENDER:
            case RouterEvent.CHANGE_ERROR:
                return RouterEventType.END

            default:
                return RouterEventType.NONE
        }
    }
}