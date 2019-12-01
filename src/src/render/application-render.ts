import { Route } from "./../route/route";
import { Router } from "./../route/router";
import { HeaderRender } from "./header-render";
import { AttributesRender } from "./attributes-render";
import { Injectable } from "../inject/injectable";
import { NimbleApp } from "./../app";
import { DiffDOM } from "./diff-dom";

@Injectable({ single: true })
export class ApplicationRender {
    private get app() { return NimbleApp.instance; }

    private diffDOM: DiffDOM = new DiffDOM();

    constructor(
        private headerRender: HeaderRender,
        private attributesRender: AttributesRender
    ) {
    }

    public virtualizeRoute(route: Route) {
        if (route.parent)
            this.virtualizeRouteInParent(route);
        else {
            this.attributesRender.clearPendingAttributesToProcess();
            this.virtualizeRouteInRootElement(route);
        }
    }

    public virtualizeSequenceRoutes(routes: Route[]) {
        for(let route of routes)
            this.virtualizeRoute(route);
    }

    private virtualizeRouteInParent(route: Route) {
        let parent = route.parent;
        route.element.virtual = this.createPageElementAndResolve(route.pageInstance.template, route.pageInstance);

        let virtualParentRouterElement = parent.element.virtual.querySelector('nimble-router');

        if (virtualParentRouterElement) {
            this.removeAllChildren(virtualParentRouterElement);
            virtualParentRouterElement.appendChild(route.element.virtual);
        }
        else {
            console.error(`The path "/${route.completePath()}" cannot be rendered, because the parent route need of "nimble-router" element in your template.`);
        }
    }

    private virtualizeRouteInRootElement(route: Route) {
        route.element.virtual = this.createPageElementAndResolve(route.pageInstance.template, route.pageInstance);

        this.removeAllChildren(this.app.rootElement.virtual);
        this.app.rootElement.virtual.appendChild(route.element.virtual);
    }

    private checkElementAlreadyRendered(element: HTMLElement, targetElement: HTMLElement) {
        if (element) {
            if (targetElement === this.app.rootElement.real) {
                for (var i = 0; i < targetElement.children.length; i++) {
                    let child = targetElement.children[i];
                    if (child === element)
                        return true;
                }
            }
            else {
                let routerElement = targetElement.querySelector('nimble-router');
                if (routerElement) {
                    for (var i = 0; i < routerElement.children.length; i++) {
                        let child = routerElement.children[i];
                        if (child === element)
                            return true;
                    }
                }
            }
        }
        return false;
    }

    private createPageElementAndResolve(template: string, pageInstance: any) {
        let virtualElement = this.createVirtualElement(template);
        this.attributesRender.resolveChildren(virtualElement.children, pageInstance);
        return virtualElement;
    }

    private createVirtualElement(html: string) {
        let element = document.createElement('nimble-page');
        element.innerHTML = html;
        return element
    }

    public removeAllChildren(element: Element) {
        if (element && element.children.length) {
            for (var i = 0; i < element.children.length; i++) {
                element.removeChild(element.children[i]);
            }
        }
    }

    public diffTreeElementsAndUpdateOld(oldTreeElments: HTMLElement, newTreeElements: HTMLElement) {
        if (oldTreeElments.outerHTML !== newTreeElements.outerHTML) {
            this.app.rootElement.real = this.diffDOM.diff(oldTreeElments, newTreeElements);
        }
        this.attributesRender.processesPendingAttributes();
    }

    public resolveAndRenderRoute(currentRoute: Route) {
        let previousRoute = Router.previous;
        let rootElement = this.app.rootElement;
        let highestParentRoute = currentRoute.getHighestParentOrHimself();
        let commonParentRoute = previousRoute ? Router.getCommonParentOfTwoRoutes(currentRoute, previousRoute) : highestParentRoute;

        this.removeAllChildren(rootElement.virtual);
        rootElement.virtual.appendChild(highestParentRoute.element.virtual);

        this.removeAllChildren(rootElement.real);
        rootElement.real.appendChild(highestParentRoute.element.virtual);

        this.headerRender.resolveTitleAndMetaTags(currentRoute);

        this.notifyOldRoutesElementDestroyed(commonParentRoute, previousRoute);
        this.notifyNewRoutesElementRendered(commonParentRoute, highestParentRoute, currentRoute);

        this.attributesRender.processesPendingAttributes();
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
}