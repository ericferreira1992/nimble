import { Injectable } from "../inject/injectable";
import { Route } from "./route";
import { RenderAbstract } from "../render/render-abstract";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { RenderHelper } from "../render/render-helper";
import { Router } from "./router";
import { HeaderRender } from "../render/header-render";

@Injectable({ single: true })
export class RouteRender extends RenderAbstract {

    constructor(
        private headerRender: HeaderRender,
        protected listenersCollector: ElementListenersCollector
    ) {
        super(listenersCollector);
    }

    /**
     * Prepare a specific route to be compiled and rendered
     * @param route 
     */
    public async prepareRouteToCompileAndRender(route: Route) {
        let childRoutes = [route, ...route.getAllParents()];
        childRoutes.reverse();

        let commonParentRoute = Router.previous ? Router.getCommonParentOfTwoRoutes(route, Router.previous) : null;

        for(let route of childRoutes) {
			const isChildOfCommonParent = commonParentRoute?.isChild(route, true) ?? true;
            if (!commonParentRoute || isChildOfCommonParent) {
				this.createElementFromStructure(route.structuredTemplate);
				await route.pageInstance.onEnter();
			}
        }
    }

    /**
     * Compile and render a specific route and your children
     * @param route 
     */
    public compileAndRenderRoute(route: Route) {
        let childRoutes = [route, ...route.getAllParents()].reverse();
		let tallestRoute = childRoutes.shift();
		let commonParentRoute = Router.previous ? Router.getCommonParentOfTwoRoutes(route, Router.previous) : null;
		
		if (commonParentRoute && Router.previous) {
			const fromPreviousToHighestParent = [Router.previous, ...Router.previous.getAllParents()];
			for (let child of fromPreviousToHighestParent) {
				if (child !== commonParentRoute) {
					(child.structuredTemplate?.compiledNode as HTMLElement)?.remove();
				}
				else {
					break;
				}
			};
		}
		
		if (commonParentRoute?.structuredTemplate?.nodeIsRenderedInDOM) {
			commonParentRoute.structuredTemplate.removeCompiledNode();
		}
		
        this.headerRender.resolveTitleAndMetaTags(tallestRoute);

		this.listenersCollector.unsubscribeAll();
		RenderHelper.removeAllChildrenOfElement(this.app.rootElement);
		
        let routeRootElement: Node = this.compileElementFromStructure(tallestRoute.structuredTemplate);

        let parent = routeRootElement;
        for(let childRoute of childRoutes) {
            let routerElement = this.getRouterElement(parent as HTMLElement);
            if (routerElement) {
				let child = this.compileElementFromStructure(childRoute.structuredTemplate);
				routerElement.appendChild(child);
                parent = child;
            }
			this.headerRender.resolveTitleAndMetaTags(childRoute);
        }

        this.app.rootElement.appendChild(routeRootElement);
    }

    /**
     * Render again a specific route and your children
     * @param route 
     */
    public rerenderRoute(route: Route) {
		let childRoutes = [route, ...route.getAllParents()].reverse();
		let parent: Node = null;

		for(let child of childRoutes) {
			if (!parent || child.structuredTemplate.isRendered) {
				this.recompileElementFromStructure(child.structuredTemplate);
			}
			else {
				let routerElement = this.getRouterElement(parent as HTMLElement);
				if (routerElement) {
					let childNode = this.compileElementFromStructure(child.structuredTemplate);
					routerElement.appendChild(childNode);
					parent = childNode;
				}
			}

			parent = child.structuredTemplate.compiledNode as HTMLElement;
		}

		// this.listenersCollector.applyAllListeners();
    }

    /**
     * Notifies the "onDestroy()" methods of pages unrendereds and "onInit()" methods of pages already rendered
     * @param route 
     */
    public async notifyRoutesAfterRouteChanged(route: Route): Promise<{ isRendered: boolean }> {
        let previousRoute = Router.previous;

        let highestParentRoute = route.getHighestParentOrHimself();
        let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(route, previousRoute) : highestParentRoute;

        await this.notifyOldRoutesElementDestroyed(commonParentRoute, previousRoute);
		let isRendered = await this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, route);
		
        return { isRendered };
    }

    /**
     * Notifies the "onInit()" methods of pages already rendered
     * @param route 
     */
    public async notifyRoutesAfterRerender(route: Route): Promise<{ isRendered: boolean }> {
        let previousRoute = Router.previous;

        let highestParentRoute = route.getHighestParentOrHimself();
		let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(route, previousRoute) : highestParentRoute;
		
		let isRendered = await this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, route, true);

        return { isRendered };
    }

    private async notifyOldRoutesElementDestroyed(commonParentRoute: Route, previousRoute: Route) {
        if (previousRoute) {
            let onlyOldRoutesRemoved: Route[] = [];

            for(let route of [previousRoute, ...previousRoute.getAllParents()]) {
                if (route === commonParentRoute)
                    break;
                onlyOldRoutesRemoved.push(route);
            }

			for (let route of onlyOldRoutesRemoved.reverse()) {
                if (!route.pageInstance.isDestroyed) {
                    route.pageInstance.isDestroyed = true;
                    await route.pageInstance.onDestroy();
                } 
			}
        }
    }

    /**
     * Notifies the "onInit()" methods of pages already rendered
     * @param commonParentRoute 
     * @param highestParentRoute 
     * @param route 
     * @param inRerender 
     */
    private async notifyNewRoutesElementRendered(commonParentRoute: Route, highestParentRoute: Route, route: Route, inRerender: boolean = false): Promise<boolean> {
        let onlyNewRoutesRendered: Route[] = [];

        let allRoutes = [route, ...route.getAllParents()];
        if (!inRerender && commonParentRoute !== highestParentRoute && highestParentRoute !== route) {
            for(let route of allRoutes) {
                if (route === commonParentRoute)
                    break;
                onlyNewRoutesRendered.push(route);
            }
        }
        else
            onlyNewRoutesRendered = allRoutes;

		let isRendered = true;
        for (let route of onlyNewRoutesRendered.reverse()) {
			isRendered = route.structuredTemplate.isRendered;
            if (!route.pageInstance.isInitialized && route.structuredTemplate.isRendered) {
				route.pageInstance.isInitialized = true;
				await route.pageInstance.onInit();
            }
		};
		
		return isRendered;
    }

    private getRouterElement(parent: HTMLElement): HTMLElement {
        return parent ? parent.querySelector('nimble-router') : null;
    }
}