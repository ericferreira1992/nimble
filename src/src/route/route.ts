import { Router } from './router';
import { RouteBase } from './route-base';
import { Page } from './../page/page';
import { isNullOrUndefined, isObject, isFunction } from 'util';
import { TemplatedPage } from '../page/templated-page';

export class Route extends RouteBase {
    public parent?: Route;
    public element: { virtual: HTMLElement, real: HTMLElement } = {
        virtual: null,
        real: null
    };

    public loadPage?: (success: (data: any) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean) => void;

    public pageInstance?: Page;
    public prevPageInstance?: Page;

    public get hasParent() { return !isNullOrUndefined(this.parent); }
    public get isAbstract() { return this.children && this.children.length > 0; }

    constructor(route?: Partial<RouteBase>) {
        super(route);
        this.checkRoutePage();
        this.checkChildren();
        this.checkRoutesParent();
    }

    private checkRoutePage() {
        if (this.page) {
            this.loadPage = (success: (data: any) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean = true) => {
                if (typeof this.page === 'string') {
                    if (makeNewInstancePage || !this.pageInstance)
                        this.pageInstance = new TemplatedPage(this.page);
                    this.pageInstance.route = this;
                    success({page: this.pageInstance, route: this});
                    complete();
                }
                else {
                    let response = this.page();

                    if (response instanceof Promise) {
                        response.then((page) => {
                            this.prevPageInstance = this.pageInstance;
                            if (makeNewInstancePage || !this.pageInstance)
                                this.pageInstance = ((typeof page.default === 'function') ? page.default() : page.default) as Page;

                            this.pageInstance.route = this;
                            success({page: this.pageInstance, route: this});
                        }, error)
                        .finally(complete);
                    }
                    else {
                        if (makeNewInstancePage || !this.pageInstance)
                            this.pageInstance = response as Page;
                        this.pageInstance.route = this;
                        success({page: this.pageInstance, route: this});
                        complete();
                    }
                }
            }
        }
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
            return Router.currentPath === this.completePath() || (alsoCheckPriority && this.isPriority);
    }

    public getMatchedPageWithLocation(alsoCheckPriority: boolean = false) {
        if (this.isAbstract && Router.currentPath.startsWith(this.completePath())) {
            for (let route of this.children as Route[]) {
                if (route.checkIfMatchCurrentLocation())
                    return route.getMatchedPageWithLocation();
            }
            for (let route of this.children as Route[]) {
                if (route.checkIfMatchCurrentLocation(true))
                    return route.getMatchedPageWithLocation(true);
            }
        }
        else if (Router.currentPath === this.completePath() || (alsoCheckPriority && this.isPriority))
            return this;
        
        return null;
    }

    public completePath(): string {
        return ((this.parent && this.parent.path)? (this.parent.completePath().concat('/')) : '') + this.path;
    }

    public getAllParents(): Route[] {
        let parents: Route[] = [];
        let route: Route = this;
        while (!isNullOrUndefined(route.parent)){
            parents.push(route.parent);
            route = route.parent;
        }
        return parents;
    }

    public getHighestParentOrHimself() {
        if (this.hasParent)
            return this.getAllParents().pop();
        else
            return this;
    }
}