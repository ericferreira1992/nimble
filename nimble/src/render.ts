import { NimbleApp } from "./app";
import { Page } from "./page";
import { GenericPage } from "./generic-page";
import { Route } from "./route/route";
import { Router } from "./route/router";
import { isArray } from "util";

export class Render {
    
    constructor(public app: NimbleApp) {   
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

            let routerElement = parent.virtualElement.resolved.querySelector('nimble-router');
            if (routerElement) {
                this.removeAllElements(routerElement);
                routerElement.appendChild(route.virtualElement.resolved);
    
                if (prevVirtualResolved)
                    prevVirtualResolved.remove();
            }
            else {
                console.error(`The path "/${route.completePath()}" cannot be rendered, because the parent route need of "nimble-router" element in your template.`);
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
                let routerElement = targetElement.querySelector('nimble-router');
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
        this.resolveTreeElements(virtualElement, pageInstance);
        return virtualElement;
    }

    private createVirtualElement(html: string) {
        let element = document.createElement('nimble-page');
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

    private resolveTreeElements(element: HTMLElement, scope: Page): AfterElementResolved {
        let afterResolved = new AfterElementResolved();

        if (this.resolveDirectiveIf(element, scope)) {
            let forDirectiveResolved = this.resolveDirectiveFor(element, scope);
            afterResolved.jumpChilren = forDirectiveResolved.jumpChildren;
            if (!forDirectiveResolved.applied) {
                if  (element.children.length > 0) {
                    for(var i = 0; i < element.children.length; i++) {
                        let child = element.children[i];
                        let childAfterResolved = this.resolveTreeElements(child as HTMLElement, scope);
    
                        if (childAfterResolved.removed)
                            i--;
                        if (childAfterResolved.jumpChilren !== 0)
                            i += childAfterResolved.jumpChilren;
    
                        if (i < 0)
                            break;
                    }
                }
    
                this.resolveInsideText(element, scope);
                this.resolveDirectiveHref(element, scope);
            }
        }
        else
            afterResolved.removed = true;

        return afterResolved;
    }

    private resolveDirectiveIf(element: HTMLElement, scope: Page): boolean {
        if (element.attributes['@if']) {
            let expressionResult = scope.eval(element.attributes['@if'].value);

            if (!expressionResult)
                element.remove();
            else
                element.removeAttribute('@if');

            return false;
        }
        return true;
    }

    private resolveDirectiveFor(element: HTMLElement, scope: Page): { applied: boolean, jumpChildren: number } {
        let resolved = {
            applied: false,
            jumpChildren: 0
        };
        if (element.attributes['@for']) {
            let forExpression = (element.attributes['@for'].value as string).trim();
            element.removeAttribute('@for');

            if (forExpression.startsWith('(') && forExpression.endsWith(')')) {
                forExpression = forExpression.substr(1, forExpression.length - 2);
            }

            if (!forExpression.startsWith('let ')) {
                element.remove();
                console.error(`SyntaxError: Invalid expression: ${forExpression}: the expression should look similar to this: let item of items`);
                resolved.jumpChildren = -1;
                return resolved;
            }
            
            let iterationVarName = forExpression.split(' ')[1];
            let interationArray = {
                expressionOrName: forExpression.split(' ').slice(3).join(''),
                value: scope.eval(forExpression.split(' ').slice(3).join('')) as any[]
            };

            if (!isArray(interationArray.value)){
                element.remove();
                console.error(`SyntaxError: Invalid expression: ${interationArray.expressionOrName} does not appear to be an array.`);
                resolved.jumpChildren = -1;
                return resolved;
            }

            let beforeElement = element;
            let index = 0;
            for(let item of interationArray.value) {
                let iterateElement = element.cloneNode(true) as HTMLElement;
                beforeElement.insertAdjacentElement('afterend', iterateElement);
                beforeElement = iterateElement;

                let scopeItem = {} as any;
                scopeItem[iterationVarName] = item;
                this.resolveTreeElements(iterateElement, new GenericPage(scope, scopeItem, { $index: index++ }));
            }

            element.remove();

            resolved.jumpChildren = interationArray.value.length - 1;
            resolved.applied = true;
        }
        return resolved;
    }

    private resolveInsideText(element: HTMLElement, scope: Page) {
        element.childNodes.forEach((node) => {
            if(node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = this.resolveInterpolationIfHave(node.nodeValue, scope);
            }
        });
    }

    private resolveDirectiveHref(element: HTMLElement, scope: Page) {
        if (element.attributes['href']) {
            let value = element.attributes['href'].value as string;
            value = this.resolveInterpolationIfHave(value, scope);
            
            if (!value.startsWith('http:') && !value.startsWith('https:')) {
                if (Router.useHash && !value.startsWith('#') && !value.startsWith('/#'))
                    value = '#/'+ value.replace(/^(\/)/g, '');
                else if (!Router.useHash) {
                    value = value.replace(/^(#)/g, '');
                    element.addEventListener('click', (e) => {
                        Router.redirect((e.target as HTMLElement).attributes['href'].value);
                        e.preventDefault();
                    });
                }
            }
            
            element.attributes['href'].value = value;
        }
    }

    private resolveInterpolationIfHave(value: string, scope: Page) {
        if(value) {
            if (/{{\s*[\w\ \.\$\!\%\+\-\*\/\>\<\=]+\s*}}/g.test(value)) {
                value = value.replace(/{{\s*[\w\ \.\$\!\%\+\-\*\/\>\<\=]+\s*}}/g, (expression) => {
                    expression = scope.eval(expression.replace(/(^{{)|(}}$)/g, ''));
                    return expression;
                });
            }
            return value;
        }
        return '';
    }
}

export class AfterElementResolved {
    removed: boolean = false;
    jumpChilren: number = 0;
}