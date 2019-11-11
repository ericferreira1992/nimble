import { MisticApp } from "./app";
import { Page } from "./page";
import { Route } from "./route/route";

export class Render {
    
    constructor(public app: MisticApp) {   
    }

    public renderRoute(route: Route) {
        if (!route.virtualElement.default)
            route.virtualElement.default = this.createVirtualElement(route.pageInstance.template);
            
        if (route.parent)
            this.renderRouteInParent(route);
        else
            this.renderRouteInRootElement(route);
    }

    private renderRouteInParent(route: Route) {
        let parent = route.parent;
        if (!this.checkElementAlreadyRendered(route.virtualElement.resolved, parent.virtualElement.resolved)) {
            let prevVirtualResolved = route.virtualElement.resolved;
            route.virtualElement.resolved = this.createResolvedElement(route.pageInstance.template, route.pageInstance);

            let routerElement = parent.virtualElement.resolved.querySelector('mistic-router');
            if (routerElement) {
                this.removeAllElements(routerElement);
                routerElement.appendChild(route.virtualElement.resolved);
    
                if (prevVirtualResolved)
                    prevVirtualResolved.remove();
            }
            else {
                console.error(`The path "/${route.completePath()}" cannot be rendered, because the parent route need of "mistic-router" element in your template.`);
            }
        }
    }

    private renderRouteInRootElement(route: Route) {
        if (!this.checkElementAlreadyRendered(route.virtualElement.resolved, this.app.rootElement)) {
            let prevVirtualResolved = route.virtualElement.resolved;
            route.virtualElement.resolved = this.createResolvedElement(route.pageInstance.template, route.pageInstance);
            
            this.removeAllElements(this.app.rootElement);
            this.app.rootElement.appendChild(route.virtualElement.resolved);

            if (prevVirtualResolved)
                prevVirtualResolved.remove();
        }
    }

    private checkElementAlreadyRendered(element: HTMLElement, targetElement: HTMLElement) {
        if (element) {
            if (targetElement === this.app.rootElement) {
                for(var i = 0; i < targetElement.children.length; i++) {
                    let child = targetElement.children[i];
                    if (child === element)
                        return true;
                }
            }
            else {
                let routerElement = targetElement.querySelector('mistic-router');
                if (routerElement) {
                    for(var i = 0; i < routerElement.children.length; i++) {
                        let child = routerElement.children[i];
                        if (child === element)
                            return true;
                    }
                }
            }
        }
        return false;
    }

    private createResolvedElement(template: string, pageInstance: any) {
        let virtualElement = this.createVirtualElement(template);
        this.resolveTreeElements(virtualElement);
        return virtualElement;
    }

    private createVirtualElement(html: string) {
        let element = document.createElement('mistic-page');
        element.innerHTML = html;
        return element
    }

    private removeAllElements(element: Element) {
        if (element && element.children.length) {
            for(var i = 0; i < element.children.length; i++) {
                element.removeChild(element.children[i]);
            }
        }
    }

    private resolveTreeElements(nodeElement: HTMLElement) {
        
    }
}