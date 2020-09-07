import { Route } from './route';
import { isNullOrUndefined, isArray } from 'util';
import { RouteBase } from './route-base';
import { NimbleApp, NimbleAppState } from '../app';
import { Page } from '../page/page';
import { RouterState } from './router-state.enum';
import { RouterStateType } from './router-event-type.enum';
import { RouterEvent } from './router-event';

export class Router {
    public static get app() { return NimbleApp.instance; }

    private static _routes: Route[] = [];
    private static _current: Route;
    private static _next: Route;
    private static _previous: Route;

    private static _state: RouterState;
    public static get state() { return this._state; };

    private static _previousState: RouterState;
    public static get previousState() { return this._previousState; };

    private static lastLocationPath: string;
    private static stopListening: boolean = false;

    private static listeners: { state: RouterState, callback: (event?: RouterEvent) => void, internal: boolean }[] = [];

    public static useHash: boolean = false;

    public static _nextPath: string = null;

    private static nextRejectedAndRedirectAfter: boolean = false;

    private static get realCurrentPath() {
		let path = (this.useHash ? location.hash : (location.pathname + location.hash))
			.replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, '');
		path = this.removeBaseHrefPath(path).replace(/^(\/)/g, '');
		return path;
	}
    public static get currentPath() {
        if (!isNullOrUndefined(this.nextPath))
            return this.nextPath;
        else {
			var path = (this.useHash ? location.hash : location.pathname).replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, '');
			path = this.removeBaseHrefPath(path).replace(/^(\/)/g, '');

            var splittedPath = path.split('#');
            return splittedPath.length > 0 ? splittedPath[0] : path;
        }
    }
    public static get nextPath() {
        if (this._nextPath) {
			var nextPath = this._nextPath.replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, '');
			nextPath = this.removeBaseHrefPath(nextPath).replace(/^(\/)/g, '');
			
            var splittedPath = nextPath.split('#');
            return splittedPath.length > 0 ? splittedPath[0] : nextPath;
        }
        return this._nextPath;
    }

    public static get routes() { return this._routes; }
    public static get abstractRoutes() { return this._routes.filter(x => x.isAbstract); }
    public static get singleRoutes() { return this._routes.filter(x => !x.isAbstract); }
    public static get current() { return this._current; }
    public static get next() { return this._next; }
    public static get previous() { return this._previous; }

    public static get onRoute() { return !isNullOrUndefined(this._current); }

    public static get rerenderedBeforeFinishedRouteChange() { return this.previousState === RouterState.FINISHED_RERENDER || this.previousState === RouterState.STARTED_RERENDER; }

    public static registerRoutes(routes: RouteBase[]) {
        if (this.app.state === NimbleAppState.INITIALIZING) {
            let route = routes.find(x => !isNullOrUndefined(x.redirect) && !isNullOrUndefined(x.page));

            if (!route) {
                this._routes = routes.map(routeBase => new Route(routeBase));
            }
            else {
                throw new Error(`Occured an error with the route with path "${route.path}". Routes cannot have "page" and "redirect" properties together. Choose one of them.`);
            }
        }
	}
	
	private static removeBaseHrefPath(path: string): string {
		if (this.app.hasBaseHref) {
			path = path.startsWith('/') ? path : `/${path}`;
			let baseHref = this.app.baseHref.replace(/^(\/)|(\/)$/g, '');
			path = path.replace(new RegExp(`^(/${baseHref})`, 'g'), '');
		}

		return path;
	}

	private static pathHasInsideBaseHref(path: string): boolean {
		if (this.app.hasBaseHref) {
			path.startsWith(this.app.baseHref);
		}

		return false;
	}

    private static async setState(state: RouterState, event: RouterEvent) {
        this._previousState = this._state;
        this._state = state;
		event = event ?? new RouterEvent({});
		await this.notifyListeners(state, { state: state, ...event });
    }

    public static start() {
        if (this.app.state === NimbleAppState.INITIALIZING) {
            this.onRedirect();

            if (this.useHash) {
                window.onhashchange = () => {
                    this.currentPath;
                    this.onRedirect();
                }
            }
            else {
                window.onpopstate = () => {
                    this.currentPath;
                    this.onRedirect();
                }
            }
        }
    }

    /**
     * Adds a listener for when the routing state changes.
     * Also it returns a void function to cancel listen when want. 
     * @param states 
     * @param callback 
     */
    public static addListener(states: string | RouterState | (RouterState | string)[], callback: (event?: RouterEvent) => void) {
        let initial: (RouterState | string)[] = !isArray(states) ? [states] : states;
        let filtered = initial.filter(state => Object.values(RouterState).map(x => x.toString()).includes(state)) as RouterState[];
        let listeners = [];

        if (initial.some(x => filtered.indexOf(x as RouterState) < 0)) {
            let invalids = initial.filter(x => !filtered.includes(x as RouterState)).map(x => `'${x}'`);
            console.warn(`The following states are invalids: ${invalids.join(', ')}.`);
        }

        for(let state of filtered) {
            let listener = { state, callback, internal: this.app.state === NimbleAppState.INITIALIZING };
            listeners.push(listener);
            this.listeners.push(listener);
        }
        return () => {
            this.listeners = this.listeners.filter(x => !listeners.some(y => x === y));
        };
	}

    /**
     * Adds a listener for when the routing change start.
     * Also it returns a void function to cancel listen when want. 
     */
	public static onStartChange(action: (event?: RouterEvent) => void): () => void {
		return this.addListener('STARTED_CHANGE', async (event: RouterEvent) => {
			await action(event);
		});
	}

    /**
     * Adds a listener for when the routing change end.
     * Also it returns a void function to cancel listen when want. 
     */
	public static onEndChange(action: (event?: RouterEvent) => void): () => void {
		return this.addListener(['FINISHED_CHANGE', 'CHANGE_REJECTED', 'CHANGE_ERROR'], async (event: RouterEvent) => {
			await action(event);
		});
	}

    private static async notifyListeners(state: RouterState, event: RouterEvent) {
        let listeners = this.listeners.filter(x => x.state === state);

        if (this.getEventType() === RouterStateType.START)
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
        
        for (let listener of listeners) {
			await listener.callback(event);
		}
    }

    private static onRedirect() {
        if (this.currentPath !== this.lastLocationPath) {
            if (isNullOrUndefined(this.nextPath)){ 
                this.lastLocationPath = this.currentPath;
            }

            let changed = false;
            if (this.checkPageCanBeCurrent()) {
                changed = this.defineCurrentPage();
                if (changed && !isNullOrUndefined(this.next.redirect)) {
                    let redirectPath = `${this.app.baseHref}${this.next.redirect}`.replace(/\/\//g,'/');;
                    this._next = null;
					this.updateURLPath(redirectPath, { pathRedirect: true });
					this._nextPath = redirectPath;
                    this.onRedirect();
                    return;
                }
                else if(!changed) {
                    if (this.current && this.current.completePath() !== this.realCurrentPath) {
                        let redirectPath = this.current.completePath();
                        this._next = null;
                        this.updateURLPath(redirectPath, { pathRedirect: true });
                        this.lastLocationPath = redirectPath;                             
                        return;
                    }
                }
            }
            this.onRouterChange(changed);
        }
    }

    private static checkPageCanBeCurrent(): boolean {
        let found = this.routes.some((route) => {
			const found = route.checkIfMatchCurrentLocation();
			return found;
        });

        if (!found) {
            found = this.routes.some((route) => {
				const found = route.path === '**';
				return found;
            });
        }

        return found;
    }

    private static defineCurrentPage(): boolean {
        let newRoute = null;

        // Find the matched route path
        for (let i = 0; i < this.routes.length; i++) {
            let route = this.routes[i];
            newRoute = route.getMatchedPageWithLocation();

            if (newRoute) {
                break;
            }
            // Check if there is another route ahead with the same path as the current one.
            /* else if(i < ((this.routes.length - 1)) && !this.routes.slice(i + 1).some(x => x.path === route.path)) {
                newRoute = route.getMatchedPageWithLocation();
                if (newRoute)
                    break;
            } */
        }

        if (!newRoute) {
            for (let i = 0; i < this.routes.length; i++) {
                let route = this.routes[i];
    
                if (route.isNotFoundPath) {
                    newRoute = route;
                    break;
                }
            }
        }

        if (!isNullOrUndefined(newRoute) && newRoute !== this.current) {
            this._next = newRoute;
            return true;
        }

        return false;
    }

    private static onRouterChange(changedPage: boolean) {
        if (changedPage && this.next) {
            if (this.next.pathWithParams || this.next.isNotFoundPath || this.next.completePath() === this.currentPath) {
                this.loadCurrentRoutePage();
            }
            else {
                this.redirect(this.next.completePath());
                this._next = null;
            }
        }
        else if (!this.next) {
            console.error(`No pages matched with this path: "/${this.currentPath}". If it path is abstract (has children), define a new route path with redirect in "routes.ts", example: { path: '', redirect: '/some-path' }.`);
            this._next = null;
            this.stopListening = true;
        }
    }

    private static async loadCurrentRoutePage() {
        await this.setState(RouterState.STARTED_CHANGE, new RouterEvent({ route: this.next }));

        if (this.next.hasParent)
            this.loadRoutesPageFromAllParents();
        else
            this.loadRoutePage(this.next).then(
                async () => {
					await this.defineCurrentAfterFinished();
					const event = new RouterEvent({route: this.current});
                    await this.setState(RouterState.FINISHED_LOADING, event);
                    await this.setState(RouterState.RENDERING, event);
                    await this.setState(RouterState.FINISHED_CHANGE, event);
                },
                async () => {
                    await this.abortChangeRoute();
                    await this.setState(RouterState.CHANGE_ERROR, new RouterEvent({route: this.current}));
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
                if (parent.route === commonParentRoute) {
                    parents.reverse();
                    break;
                }
            }
        }

        let action = () => {
            if (parents.length > 0) {
                let parent = parents.pop();
                this.loadRoutePage(parent.route, parent.makeNewInstance).then(
                    () => {
                        action();
                    },
                    async (error) => {
                        await this.abortChangeRoute();
                        await this.setState(RouterState.ERROR_LOADING, error);
                    }
                );
            }
            else{
                this.loadRoutePage(this.next).then(
                    async () => {
						await this.defineCurrentAfterFinished();
						const event = new RouterEvent({route: this.current});
                        await this.setState(RouterState.FINISHED_LOADING, event);
                        await this.setState(RouterState.RENDERING, event);
                        await this.setState(RouterState.FINISHED_CHANGE, event);
                    },
                    async () => {
                        await this.abortChangeRoute();
                        await this.setState(RouterState.CHANGE_ERROR, new RouterEvent({route: this.current}));
                    },
                );
            }
        }

        action();
    }

    private static async defineCurrentAfterFinished() {
        if (this._current)
            this._previous = this._current;
    
        if (this.next) {
            this._current = this.next;
            this._next = null;
        }

        if (!isNullOrUndefined(this._nextPath)) {
            await this.updateURLPath(this._nextPath);
            this._nextPath = null;
        }
        
        this.lastLocationPath = this.currentPath;
        await this.notifyOldRoutesElementExit();
    }

    private static async abortChangeRoute() {
        if(!isNullOrUndefined(this.nextPath) && !this.nextRejectedAndRedirectAfter && this.current) {
            let currentPath = this.nextPath;
            this._next = null;
            this._nextPath = null;
            
            await this.updateURLPath(currentPath);
            this.lastLocationPath = this.currentPath;
        }
        else if (isNullOrUndefined(this.nextPath) && !this.nextRejectedAndRedirectAfter) {
            console.error(`Page of path "/${this.currentPath}" was rejected. In this case, there is no previous route for us can to return to, we suggest that you do some "Router.redirect('/you-secured-path')" in your ActivatedRoute class for these cases.`);
            this._next = null;
            this.stopListening = true;
        }
    }

    private static async updateURLPath(path: string, options: { pathRedirect: boolean } = {} as any) {

        let isChangingHashLink = (): boolean =>  {
            return path.includes('#') && this.realCurrentPath.includes('#');
        };
        let isAddingHashLink = (): boolean =>  {
			return path.includes('#') &&
				path.split('#')[0].replace(/^(\/#\/|#\/|\/#|\/|#)|(\/)$/g, '') === this.realCurrentPath.replace(/^(\/)/g, '');
        };
        let isRemovingHashLink = (): boolean =>  {
			return this.realCurrentPath.includes('#') &&
				this.realCurrentPath.split('#')[0].replace(/\/$/g, '') === path.replace(/^(\/)/g, '');
        };

        let pathWithoutHash = ((!this.useHash && path.includes('#')) ? path.split('#')[0] : path).replace(/^(\/)/g, '');
        let currentPathWithoutHash = ((!this.useHash && this.realCurrentPath.includes('#')) ? this.realCurrentPath.split('#')[0] : path).replace(/^(\/)/g, '');;
        if (currentPathWithoutHash.includes('#')) {
			currentPathWithoutHash = currentPathWithoutHash.split('#')[0];
		}

        if ((path.includes('#') || this.realCurrentPath.includes('#')) && pathWithoutHash === currentPathWithoutHash) {
            if (isChangingHashLink() || isAddingHashLink()) {
                location.hash = path.split('#')[1];
                return;
            }
            else if (isRemovingHashLink()) {
                location.hash = '';
                return;
            }
        }

        path = (path.startsWith('/') ? '' : '/') + path;
        
        if (this.useHash)
            location.hash = path;
        else {
            if (options?.pathRedirect) {
                history.replaceState(null, null, path);
            }
            else {
                history.pushState(null, null, path);
            }
        }
    }

    private static loadRoutePage(route: Route, makeNewInstacePage: boolean = true) {
        return new Promise<Route>(async (resolve, reject) => {
            await this.setState(RouterState.STARTED_LOADING, new RouterEvent({route: route}));
            
            route.loadPage(
                async (route: Route) => {
                    if (this.routeCanActivate(route)) {
                        route.pageInstance.onNeedRerender = this.whenRerenderIsRequested.bind(this);
                        route.pageInstance.pageParent = route.parent ? route.parent.pageInstance : null;
                        await this.setState(RouterState.FINISHED_LOADING, new RouterEvent({route: route}));
                        resolve(route);
                    }
                    else{
                        await this.setState(RouterState.CHANGE_REJECTED, new RouterEvent({route: route}));
                        reject(null);
                    }
                },
                async (error) => {
                    console.error(error);
                    await this.setState(RouterState.ERROR_LOADING, error);
                    reject(error);
                },
                () => {
                },
                makeNewInstacePage
            );
        });
    }

    private static routeCanActivate(route: Route) {
        let currentPath = (this.realCurrentPath.startsWith('/') ? '' : '/') + this.realCurrentPath;
        let nextPath = this.nextPath ? ((this.nextPath.startsWith('/') ? '' : '/') + this.nextPath) : currentPath;

        if (route.guard && route.guard.length > 0) {
            for(let routeActivate of route.guard) {
                let instance = NimbleApp.inject(routeActivate);
                if (instance && !instance.doActivate(currentPath, nextPath, route))
                    return false;
            }
        }
        return true;
    }

    public static async redirect(path: string) {
		let hasBaseHref = this.pathHasInsideBaseHref(path);

        this.nextRejectedAndRedirectAfter = (!isNullOrUndefined(this.nextPath) || !this.current) ? true : false;
        if (this.nextRejectedAndRedirectAfter && isNullOrUndefined(this.current)) {
			this._next = null;
			this.updateURLPath(path, { pathRedirect: true });
			this._nextPath = path;
        }

        if (!this.pathIsHashLink(path) || !this.pathIsHashLink(path, { checkIsCurrent: true })) {
            let pathWithoutHash = this.removeBaseHrefPath(path.includes('#') ? path.split('#')[0] : path).replace(/^\//g, '');
            if (this.currentPathIsHashLink() && this.currentPath !== pathWithoutHash)
                this._nextPath = path;
            else {
                let currentPageIsThisPath = this.current?.completePath() === pathWithoutHash;
                this.updateURLPath(path, { pathRedirect: currentPageIsThisPath });

                if (currentPageIsThisPath) {
					// await this.setState(RouterEvent.STARTED_CHANGE, this.current);
					// await this.setState(RouterEvent.FINISHED_CHANGE, this.current);
                    return;
                }
            }
        }
        else
            this.updateURLPath(path);
        
        this.onRedirect();
    }

    private static pathIsHashLink(path: string, options: { checkIsCurrent: boolean } = {} as any): boolean {
        path = path.replace(/^\//g, '');

        if (options.checkIsCurrent) {
            if (path.includes('#') && path.startsWith(this.currentPath)) {
                let subtractedPath = path.replace(this.currentPath, '');
                return subtractedPath.startsWith('/#');
            }
            else
                return false;
        }

        return path.includes('#');
    }

    private static currentPathIsHashLink(): boolean {
        return this.realCurrentPath.includes('#');
    }

    private static async notifyOldRoutesElementExit() {
        let highestParentRoute = this.current.getHighestParentOrHimself();
        let commonParentRoute = this.previous ? Router.getCommonParentOfTwoRoutes(this.current, this.previous) : highestParentRoute;
        
        if (this.previous) {
            let onlyOldRoutes: Route[] = [];

            for(let route of [this.previous, ...this.previous.getAllParents()]) {
                if (route === commonParentRoute)
                    break;
                onlyOldRoutes.push(route);
            }

            for (let route of onlyOldRoutes.reverse()) {
                await route.pageInstance.onExit();
            };
        }
    }

    private static async whenRerenderIsRequested(page: Page): Promise<any> {
        if (this.state !== RouterState.RENDERING) {
			let changingRouteInProgress = this.state === RouterState.STARTED_CHANGE;
			
			let routeToRender = (changingRouteInProgress && this.previous) ? this.previous : this.current;

			await this.setState(RouterState.STARTED_RERENDER, new RouterEvent({route: routeToRender}));
			await this.setState(RouterState.FINISHED_RERENDER, new RouterEvent({route: this.current}));
	
			if (changingRouteInProgress)
				this._state = RouterState.STARTED_CHANGE;
        }
        else {
            console.warn(`The render() was requested and did not work because the page was being constructing.`);
        }
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

    private static getEventType(state?: RouterState) {
        state = state ? state : this.state;
        switch(state) {
            case RouterState.STARTED_CHANGE:
            case RouterState.STARTED_LOADING:
            case RouterState.STARTED_RERENDER:
                return RouterStateType.START

            case RouterState.FINISHED_CHANGE:
            case RouterState.FINISHED_LOADING:
            case RouterState.ERROR_LOADING:
            case RouterState.FINISHED_RERENDER:
            case RouterState.CHANGE_ERROR:
                return RouterStateType.END

            case RouterState.RENDERING:
            default:
                return RouterStateType.NONE
        }
    }
}