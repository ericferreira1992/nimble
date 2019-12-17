import { Router } from './router';
import { RouteBase } from './route-base';
import { Page } from './../page/page';
import { isNullOrUndefined, isObject, isFunction } from 'util';
import { TemplatedPage } from '../page/templated-page';
import { Type } from '../inject/type.interface';
import { NimbleApp } from '../app';
import { DirectiveExecute } from '../render/attributes-render';

export class Route extends RouteBase {
    public parent?: Route;
    public element: { virtual: HTMLElement, real: HTMLElement } = {
        virtual: null,
        real: null
    };

    public pageType: Type<Page>;

    public loadPage?: (success: (data: any) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean) => void;

    public pageInstance?: Page;
    public prevPageInstance?: Page;

    public get hasParent() { return !isNullOrUndefined(this.parent); }
    public get isAbstract() { return this.children && this.children.length > 0; }
    public get childIndex() { return this.parent ? (this.parent.children.indexOf(this)) : 0; }
    
    public executedDirectives: DirectiveExecute[] = [];

    constructor(route?: Partial<RouteBase>) {
        super(route);
        this.checkRoutePage();
        this.checkChildren();
        this.checkRoutesParent();
    }

    private checkRoutePage() {
        if (this.page) {
            this.loadPage = (success: (route: Route) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean = true) => {
                if (typeof this.page === 'string') {
                    try {
                        if (makeNewInstancePage || !this.pageInstance) {
                            this.pageType = TemplatedPage;
                            this.executedDirectives = [];
                            this.pageInstance = new TemplatedPage(this.page);
                        }
                        this.pageInstance.route = this;
                        success(this);
                        complete();
                    }
                    catch (e) {
                        error(e);
                        throw e;
                    }
                }
                else {
                    if (this.page.name === 'page') {
                        try {
                            (this.page as () => Promise<any>)()
                                .then(
                                    (pageType) => {
                                        try {
                                            this.prevPageInstance = this.pageInstance;
                                            if (makeNewInstancePage || !this.pageInstance) {
                                                this.pageType = pageType.default;
                                                this.executedDirectives = [];
                                                this.pageInstance = NimbleApp.inject<Page>(pageType.default);
                                            }

                                            this.pageInstance.route = this;
                                            success(this);
                                        }
                                        catch (e) {
                                            error(e);
                                            throw e;
                                        }
                                    },
                                    error
                                )
                                .finally(complete);
                        }
                        catch (e) {
                            error(e);
                            throw e;
                        }
                    }
                    else {
                        try {
                            if (makeNewInstancePage || !this.pageInstance) {
                                this.pageType = this.page as Type<Page>;
                                this.executedDirectives = [];
                                this.pageInstance = NimbleApp.inject<Page>(this.page as Type<Page>);
                            }
                            this.pageInstance.route = this;
                            success(this);
                            complete();
                        }
                        catch (e) {
                            error(e);
                            throw e;
                        }
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
                return true;
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
                if (route.checkIfMatchCurrentLocation(alsoCheckPriority))
                    return route.getMatchedPageWithLocation(alsoCheckPriority);
            }
        }
        else if (Router.currentPath === this.completePath() || (alsoCheckPriority && this.isPriority))
            return this;

        return null;
    }

    public completePath(): string {
        return ((this.parent && this.parent.path) ? (this.parent.completePath().concat('/')) : '') + this.path;
    }

    public getAllParents(): Route[] {
        let parents: Route[] = [];
        let route: Route = this;
        while (!isNullOrUndefined(route.parent)) {
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

    public notifyDestructionExecutedsDirectives() {
        for(let proc of this.executedDirectives) {
            for(let applicable of proc.applicables)
                proc.directiveInstance.onDestroy(applicable.selector, proc.scope);
        }
        this.executedDirectives = [];
    }
}