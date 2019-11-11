import { Route } from './route';
import { isNullOrUndefined } from 'util';
import { RouteBase } from './route-base';

export class Router {
    
    private static _routes: Route[] = [];
    private static _current: Route;
    private static _previous: Route;

    private static lastPathLocation: string;
    private static listeningLocation: NodeJS.Timer;

    private static listeners: { type: string, callback: (route?: any) => void }[] = [];

    public static get routes() { return this._routes; }
    public static get current() { return this._current; }
    public static get previous() { return this._previous; }

    public static get onRoute() { return !isNullOrUndefined(this._current); }

    public static get locationPath() { return location.hash.replace(/\/|#/g, ''); }

    public static defineRoutes(routes: RouteBase[]) {
        this._routes = routes.map(route => new Route(route));
    }

    public static start() {
        this.startListening();
    }

    public static addListener(type: string, callback: () => void) {
        let listener = { type, callback };
        this.listeners.push(listener);
        return () => this.listeners = this.listeners.filter(x => x != listener);
    }

    private static startListening() {
        this.listeningLocation = setInterval(() => {
            if (!this.onRoute || this.locationPath !== this.lastPathLocation) {
                this.lastPathLocation = this.locationPath;
                let changed = false;
                if (this.checkPageCanBeCurrent()) {
                    changed = this.defineCurrentPage();
                }
                this.onRouterChange(changed);
            }
        }, 200);
    }

    private static checkPageCanBeCurrent(): boolean {
        return this.routes.some(route => {
            return route.checkIfMatchCurrentLocation(true);
        });
    }

    private static defineCurrentPage(): boolean {
        let newRoute = null;

        for(let route of this.routes) {
            newRoute = route.getMatchedPageWithLocation();
            if (newRoute)
                break;
        }

        if (newRoute !== this.current) {
            this._previous = this._current;
            this._current = newRoute;
            return true;
        }

        return false;
    }

    private static onRouterChange(changedPage: boolean) {
        if (changedPage && this.current) {
            if (!this.current.isPriority || this.current.completePath() === this.locationPath) {
                this.listeners.filter(x => x.type === 'change')
                              .forEach((listener) => listener.callback(this.current));
    
                this.loadCurrentRoutePage();
            }
            else
                this.redirect(this.current.completePath());
        }
        else if (!this.current) {
            console.error(`No pages matched with this path: "/${this.locationPath}". If it path is abstract (has childrens), set one child as 'isPriority: true' in "routes.ts".`);
            this.redirect('');
            clearInterval(this.listeningLocation);
        }
    }

    private static loadCurrentRoutePage() {
        if (this.current.hasParent)
            this.loadRoutesPageFromAllParents();
        else
            this.loadRoutePage(this.current);
    }

    private static loadRoutesPageFromAllParents() {
        let routeParents = this.current.getAllParents();

        let action = () => {
            if (routeParents.length > 0)
                this.loadRoutePage(routeParents.pop()).then(
                    () => action(),
                    (error) => {
                        this.notifyListeners('loadingCompleted');
                        this.notifyListeners('errorLoading', error);
                    }
                );
            else
                this.loadRoutePage(this.current);  
        }

        action();
    }

    private static loadRoutePage(route: Route, silentMode: boolean = false, notifyStart: boolean = true) {
        return new Promise<Route>((resolve, error) => {
            if (!silentMode && notifyStart) this.notifyListeners('startedLoading', route);
            route.loadPage(
                (page) => {
                    if (!silentMode) this.notifyListeners('finishedLoading', route);
                    resolve(route);
                },
                (error) => {
                    if (!silentMode) this.notifyListeners('errorLoading', error);
                    error(error);
                },
                () => {
                    if (!silentMode) this.notifyListeners('loadingCompleted');
                },
            );
        });
    }

    private static notifyListeners(type: string, sender?: any) {
        this.listeners.filter(x => x.type === type)
                      .forEach((listener) => listener.callback(sender));
    }

    public static redirect(route: string) {
        location.hash = (route.startsWith('/') ? '' : '/') + route;
    }
}