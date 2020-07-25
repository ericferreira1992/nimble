import { Injectable } from "../inject/injectable";
import { Route } from "./route";
import { RenderAbstract } from "../render/render-abstract";
import { ListenersCollector } from "../providers/listeners-collector";
import { RenderHelper } from "../render/render-helper";
import { Router } from "./router";
import { HeaderRender } from "../render/header-render";

@Injectable({ single: true })
export class RouteRender extends RenderAbstract {

    constructor(
        private headerRender: HeaderRender,
        protected listenersCollector: ListenersCollector
    ) {
        super(listenersCollector);
    }

    /**
     * Prepare a specific route to be compiled and rendered
     * @param route 
     */
    public prepareRouteToCompileAndRender(route: Route) {
        let childRoutes = [route, ...route.getAllParents()];
        childRoutes.reverse();

        let commonParentRoute = Router.previous ? Router.getCommonParentOfTwoRoutes(route, Router.previous) : null;

        for(let route of childRoutes) {
            this.createElementFromStructure(route.structuredTemplate);
            
            if (!commonParentRoute || commonParentRoute.isChild(route, true))
                route.pageInstance.onEnter();
        }
    }

    /**
     * Compile and render a specific route and your children
     * @param route 
     */
    public compileAndRenderRoute(route: Route) {
        let childRoutes = [route, ...route.getAllParents()].reverse();
        let talletsRoute = childRoutes[0];

        let routeRootElement: Node = this.compileElementFromStructure(talletsRoute.structuredTemplate);

        let parent = routeRootElement;
        for(let route of childRoutes.slice(1)) {
            let routerElement = this.getRouterElement(parent as HTMLElement);
            if (routerElement) {
                let child = this.compileElementFromStructure(route.structuredTemplate);
                routerElement.appendChild(child);
                parent = child
            }
        }

        RenderHelper.removeAllChildrenOfElement(this.app.rootElement.real);
        this.app.rootElement.real.appendChild(routeRootElement);

        this.listenersCollector.applyAllListeners();

        this.headerRender.resolveTitleAndMetaTags(route);
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

		this.listenersCollector.applyAllListeners();
    }

    /**
     * Notifies the "onDestroy()" methods of pages unrendereds and "onInit()" methods of pages already rendered
     * @param route 
     */
    public notifyRoutesAfterRouteChanged(route: Route): { isRendered: boolean } {
        let previousRoute = Router.previous;

        let highestParentRoute = route.getHighestParentOrHimself();
        let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(route, previousRoute) : highestParentRoute;

        this.notifyOldRoutesElementDestroyed(commonParentRoute, previousRoute);
		let isRendered = this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, route);
		
        return { isRendered };
    }

    /**
     * Notifies the "onInit()" methods of pages already rendered
     * @param route 
     */
    public notifyRoutesAfterRerender(route: Route): { isRendered: boolean } {
        let previousRoute = Router.previous;

        let highestParentRoute = route.getHighestParentOrHimself();
        let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(route, previousRoute) : highestParentRoute;

        return {
			isRendered: this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, route, true)
		};
    }

    private notifyOldRoutesElementDestroyed(commonParentRoute: Route, previousRoute: Route) {
        if (previousRoute) {
            let onlyOldRoutesRemoved: Route[] = [];

            for(let route of [previousRoute, ...previousRoute.getAllParents()]) {
                if (route === commonParentRoute)
                    break;
                onlyOldRoutesRemoved.push(route);
            }

            onlyOldRoutesRemoved.reverse().forEach((route) => {
                if (!route.pageInstance.isDestroyed) {
                    route.pageInstance.isDestroyed = true;
                    route.pageInstance.onDestroy();
                } 
            });
        }
    }

    /**
     * Notifies the "onInit()" methods of pages already rendered
     * @param commonParentRoute 
     * @param highestParentRoute 
     * @param route 
     * @param inRerender 
     */
    private notifyNewRoutesElementRendered(commonParentRoute: Route, highestParentRoute: Route, route: Route, inRerender: boolean = false): boolean {
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
        onlyNewRoutesRendered.reverse().forEach((route) => {
			isRendered = route.structuredTemplate.isRendered;
            if (!route.pageInstance.isInitialized && route.structuredTemplate.isRendered) {
                route.pageInstance.isInitialized = true;
                route.pageInstance.onInit();
            }
		});
		
		return isRendered;
    }

    private getRouterElement(parent: HTMLElement): HTMLElement {
        return parent ? parent.querySelector('nimble-router') : null;
    }
}