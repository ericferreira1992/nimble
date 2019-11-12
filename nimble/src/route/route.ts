import { Router } from './router';
import { RouteBase } from './route-base';
import { isNullOrUndefined } from 'util';

export class Route extends RouteBase {
    public parent?: Route;
    public virtualElement: { default: HTMLElement, resolved: HTMLElement } = {
        default: null,
        resolved: null
    };

    public get hasParent() { return !isNullOrUndefined(this.parent); }
    public get isAbstract() { return this.children && this.children.length > 0; }

    constructor(route?: Partial<RouteBase>) {
        super(route);
 
        this.checkChildren();
        this.checkRoutesParent();
    }

    private checkChildren() {
        if (this.isAbstract)
            this.children = this.children.map(route => new Route(route));
    }

    private checkRoutesParent() {
        if (this.isAbstract)
            this.children.forEach((route: Route) => route.parent = this);
    }

    public checkIfMatchCurrentLocation(alsoCheckPriority: boolean = false) {
        if (this.isAbstract) {
            if (this.children.some((route: Route) => route.checkIfMatchCurrentLocation()))
                return true
            else if (alsoCheckPriority && this.children.some((route: Route) => route.checkIfMatchCurrentLocation(true)))
                return true;
            return false;
        }
        else
            return Router.currentLocationPath === this.completePath() || (alsoCheckPriority && this.isPriority);
    }

    public getMatchedPageWithLocation(alsoCheckPriority: boolean = false) {
        if (this.isAbstract && Router.currentLocationPath.startsWith(this.completePath())) {
            for (let route of this.children as Route[]) {
                if (route.checkIfMatchCurrentLocation())
                    return route.getMatchedPageWithLocation();
            }
            for (let route of this.children as Route[]) {
                if (route.checkIfMatchCurrentLocation(true))
                    return route.getMatchedPageWithLocation(true);
            }
        }
        else if (Router.currentLocationPath === this.completePath() || (alsoCheckPriority && this.isPriority))
            return this;
        
        return null;
    }

    public completePath(): string {
        return ((this.parent && this.parent.path)? (this.parent.completePath().concat('/')) : '') + this.path;
    }

    public getAllParents() {
        let parents = [];
        let route: Route = this;
        while (!isNullOrUndefined(route.parent)){
            parents.push(route.parent);
            route = route.parent;
        }
        return parents;
    }
}