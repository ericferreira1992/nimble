import { Router } from './router';
import { RouteBase } from './route-base';
import { Page } from './../page/page';
import { isNullOrUndefined } from 'util';
import { TemplatedPage } from '../page/templated-page';
import { Type } from '../inject/type.interface';
import { NimbleApp } from '../app';
import { DirectiveExecute } from '../render/attributes-render';
import { RouteParams } from '../providers/route-params/route-params';

export class Route extends RouteBase {
    public parent?: Route;
    public element: { virtual: HTMLElement, real: HTMLElement } = {
        virtual: null,
        real: null
    };

    public get isNotFoundPath() { return this.path === '**'; }
    public get pathWithParams() { return /{(.|\n)*?}/g.test(this.path); }

    public pageType: Type<Page>;

    public loadPage?: (success: (data: any) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean) => void;

    public pageInstance?: Page;
    public prevPageInstance?: Page;

    public routeParams: RouteParams = new RouteParams();

    public get hasParent() { return !isNullOrUndefined(this.parent); }
    public get isAbstract() { return this.children && this.children.length > 0; }
    public get childIndex() { return this.parent ? (this.parent.children.indexOf(this)) : 0; }
    
    public executedDirectives: DirectiveExecute[] = [];

    constructor(route?: Partial<RouteBase>) {
        super(route);
        this.trimRoutePath();
        this.checkRoutePage();
        this.checkChildren();
        this.checkRoutesParent();
    }

    private trimRoutePath() {
        this.path = (this.path ? this.path : '').trim();
        this.path = this.path.replace(/(^\/)|(\/$)/g, '');
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
                                .then((pageType) => {
                                    try {
                                        if (makeNewInstancePage || !this.pageInstance) {
                                            this.instancePage(pageType)
                                        }
                                        success(this);
                                    }
                                    catch (e) {
                                        error(e);
                                        throw e;
                                    }
                                })
                                .catch(error)
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
                                this.instancePage(this.page as Type<Page>);
                            }
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

    private instancePage(pageType: Type<Page>) {
        this.pageType = pageType;
        this.executedDirectives = [];
        this.prevPageInstance = this.pageInstance;
        this.routeParams = new RouteParams();
        this.pageInstance = NimbleApp.inject<Page>(this.pageType, (instance) => {
            if (instance instanceof RouteParams) {
                instance.data = this.data;
                instance.params = this.getParams();
                instance.parent = this.parent && this.parent.routeParams;
                this.routeParams = instance;
            }
        });

        if (!this.pageInstance) {
            throw new Error(`Cannot be load page of path: '${this.completePath()}'`);
        }
    }

    private getParams(): { [key: string]: any } {
        let params = {} as any;

        if (/{(.|\n)*?}/g.test(this.path)) {
            let pieceOfCurrentPath = this.getPieceRelativeOfTheCurrentPath();
            let piecesSplited = pieceOfCurrentPath.split('/');
            this.path.split('/').forEach((paramNamePiece, index) => {
                if (/(^{)|(}$)/g.test(paramNamePiece) && index < piecesSplited.length) {
                    let paramName = paramNamePiece.replace(/(^{)|(}$)/g, '');
                    let paramValue = piecesSplited[index];
                    params[paramName] = paramValue;
                }
            });
        }

        return params;
    }

    private getPieceRelativeOfTheCurrentPath() {
        let begin = (this.parent && this.parent.completePath().includes('/'))
            ? (this.parent.completePath().split('/').length)
            : 0;
        let end = begin + this.path.split('/').length;
        
        let currentPathSplitted = Router.currentPath.split('/');
        currentPathSplitted = currentPathSplitted.slice(begin, end);
        
        let pieceCurrentPath = currentPathSplitted.join('/');

        return pieceCurrentPath;
    }

    private checkChildren(){
        if (this.isAbstract)
            this.children = this.children.map(route => new Route(route));
    }

    private checkRoutesParent() {
        if (this.isAbstract)
            this.children.forEach((route: Route) => route.parent = this);
    }

    public checkIfMatchCurrentLocation() {
        if (this.isAbstract && this.currentPathStartsRoutePath()) {
            if (this.children.some((route: Route) => route.checkIfMatchCurrentLocation()))
                return true;
            return false;
        }
        else
            return this.currentPathIsMatch();
    }

    public getMatchedPageWithLocation() {
        if (this.isAbstract && this.currentPathStartsRoutePath()) {
            for (let route of this.children as Route[]) {
                if (route.checkIfMatchCurrentLocation())
                    return route.getMatchedPageWithLocation();
            }
        }
        else if (this.currentPathIsMatch())
            return this;

        return null;
    }

    private currentPathIsMatch() {
        let completePath = this.completePath();
        if (/{(.|\n)*?}/g.test(completePath)) {
            let regex = completePath.replace(/{(.|\n)*?}/g, (param) => {
                return '(.|\n)*';
            });
            return RegExp(regex, 'g').test(Router.currentPath);
        }
        else
            return Router.currentPath === this.completePath();
    }

    private currentPathStartsRoutePath() {
        let completePath = this.completePath();
        if (/{(.|\n)*?}/g.test(completePath)) {
            let regex = completePath.replace(/{(.|\n)*?}/g, (param) => {
                return '(.*)';
            });
            return RegExp(regex, 'g').test(Router.currentPath);
        }
        else
            return Router.currentPath.startsWith(this.completePath());
    }

    public completePath(): string {
        let path = ((this.parent && this.parent.path) ? (this.parent.completePath().concat('/')) : '') + this.path;
        return path.endsWith('/') ? path.substr(0, path.length - 1) : path;
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