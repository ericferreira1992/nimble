import { Router } from './router';
import { RouteBase } from './route-base';
import { Page } from './../page/page';
import { isNullOrUndefined, isArray } from 'util';
import { TemplatedPage } from '../page/templated-page';
import { Type } from '../inject/type.interface';
import { NimbleApp } from '../app';
import { RouteParams } from '../providers/route-params/route-params';
import { ElementStructure } from '../render/element-structure';
import { RenderHelper } from '../render/render-helper';

export class Route extends RouteBase {
    public parent?: Route;
    public structuredTemplate: ElementStructure = null;

    public get isNotFoundPath() { return this.path === '**'; }
    public get pathWithParams() { return /{(.|\n)*?}/g.test(this.path); }

    public pageType: Type<Page>;

    public pageInstance?: Page;
    public prevPageInstance?: Page;

    public routeParams: RouteParams = new RouteParams();

    public get hasParent() { return !isNullOrUndefined(this.parent); }
    public get isAbstract() { return this.children && this.children.length > 0; }
    public get childIndex() { return this.parent ? (this.parent.children.indexOf(this)) : 0; }
    public get tallestParent() { return this.hasParent ? this.getAllParents().pop() : this; }

    private _pageTemplate: string = '';
    private get pageTemplate() { return this._pageTemplate; }

    constructor(route?: Partial<RouteBase>) {
        super(route);
        this.trimRoutePath();
        this.checkChildren();
        this.checkRoutesParent();
    }

    public isChild(route: Route, deep: boolean = false): boolean {
        return this.children != null && this.children.some((child) => {
            return child === route || (deep && (child as Route).isChild(route, true));
        });
    }
	
	public async loadPage(success: (route: Route) => void, error: (error: any) => void, complete: () => void, makeNewInstancePage: boolean = true){
		if (typeof this.page === 'string') {
			try {
				if (makeNewInstancePage || !this.pageInstance) {
					this.pageType = TemplatedPage;
					this.pageInstance = new TemplatedPage(this.page);
					this.structureTemplate();
				}
				await success(this);
				await complete();
			}
			catch (e) {
				await error(e);
				throw e;
			}
		}
		else if (this.page.name === 'page') {
			try {
				(this.page as () => Promise<any>)()
					.then(async (pageType) => {
						try {
							if (makeNewInstancePage || !this.pageInstance) {
								this.instancePage(pageType)
							}
							await success(this);
						}
						catch (e) {
							await error(e);
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
				await success(this);
				await complete();
			}
			catch (e) {
				await error(e);
				throw e;
			}
		}
	}

    private trimRoutePath() {
        this.path = (this.path ?? '').trim().replace(/(^\/)|(\/$)/g, '');
    }

    private instancePage(pageType: Type<Page>) {
        this.pageType = pageType;
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

		if (this.pageInstance.template) {
			this._pageTemplate = this.pageInstance.template;
			delete this.pageInstance.template;
		}
		
        if (this.pageInstance) {
            this.structureTemplate();
        }
        else {
            throw new Error(`Cannot be load page of path: '${this.completePath()}'`);
        }
    }

    private structureTemplate() {
        this.structuredTemplate = RenderHelper.buildStructureFromTemplate(this.pageTemplate, this.pageInstance, 'nimble-page');
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
			if (route.parent.page) {
				parents.push(route.parent);
			}
            route = route.parent;
        }
        return parents;
    }

    public getHighestParentOrHimself() {
        return this.hasParent ? this.getAllParents().pop() : this;
	}
}