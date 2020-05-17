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

    public processRoute(currentRoute: Route) {
        let childRoutes = [currentRoute, ...currentRoute.getAllParents()];
        childRoutes.reverse();

        let commonParentRoute = Router.previous ? Router.getCommonParentOfTwoRoutes(currentRoute, Router.previous) : null;

        for(let route of childRoutes) {
            this.createElementFromStructure(route.structuredTemplate);
            
            if (!commonParentRoute || commonParentRoute.isChild(route, true))
                route.pageInstance.onEnter();
        }
    }

    public compileAndRenderRoute(route: Route) {
        let previousRoute = Router.previous;
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
            else {
                console.error(`The path "/${route.completePath()}" cannot be rendered, because the parent route need of "nimble-router" element in your template.`);

                RenderHelper.removeAllChildrenOfElement(this.app.rootElement.real);
                this.app.rootElement.real.appendChild(routeRootElement);
                
                return;
            }
        }

        RenderHelper.removeAllChildrenOfElement(this.app.rootElement.real);
        this.app.rootElement.real.appendChild(routeRootElement);

        this.listenersCollector.applyAllListeners();

        let highestParentRoute = route.getHighestParentOrHimself();
        let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(route, previousRoute) : highestParentRoute;

        this.headerRender.resolveTitleAndMetaTags(route);

        this.notifyOldRoutesElementDestroyed(commonParentRoute, previousRoute);
        this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, route);
    }

    public rerenderRoute(route: Route) {
        let childRoutes = [route, ...route.getAllParents()].reverse();

        for(let route of childRoutes) {
            this.recompileElementFromStructure(route.structuredTemplate);
        }

        this.listenersCollector.applyAllListeners();
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

    private notifyNewRoutesElementRendered(commonParentRoute: Route, highestParentRoute: Route, currentRoute: Route) {
        let onlyNewRoutesRendered: Route[] = [];

        if (commonParentRoute !== highestParentRoute && highestParentRoute !== currentRoute)
            for(let route of [currentRoute, ...currentRoute.getAllParents()]) {
                if (route === commonParentRoute)
                    break;
                onlyNewRoutesRendered.push(route);
            }
        else
            onlyNewRoutesRendered = [currentRoute, ...currentRoute.getAllParents()];

        onlyNewRoutesRendered.reverse().forEach((route) => {
            if (!route.pageInstance.isInitialized) {
                route.pageInstance.isInitialized = true;
                route.pageInstance.onInit();
            }
        });
    }

    private getRouterElement(parent: HTMLElement): HTMLElement {
        return parent ? parent.querySelector('nimble-router') : null;
    }
}