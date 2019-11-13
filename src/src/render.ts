import { NimbleApp } from "./app";
import { Page } from "./page";
import { GenericPage } from "./generic-page";
import { Route } from "./route/route";
import { Router } from "./route/router";
import { isArray } from "util";

const { DiffDOM } = require('diff-dom');

export class Render {

    private diffDOM: any;

    constructor(public app: NimbleApp) {
        this.diffDOM = new DiffDOM();
    }

    public renderRoute(route: Route) {
        if (route.parent)
            this.renderRouteInParent(route);
        else
            this.renderRouteInRootElement(route);
    }

    private renderRouteInParent(route: Route) {
        let parent = route.parent;
        route.element.virtual = this.createResolvedElement(route.pageInstance.template, route.pageInstance);

        let virtualParentRouterElement = parent.element.virtual.querySelector('nimble-router');

        if (virtualParentRouterElement) {
            this.removeAllChildren(virtualParentRouterElement);
            virtualParentRouterElement.appendChild(route.element.virtual);
        }
        else {
            console.error(`The path "/${route.completePath()}" cannot be rendered, because the parent route need of "nimble-router" element in your template.`);
        }
    }

    private renderRouteInRootElement(route: Route) {
        route.element.virtual = this.createResolvedElement(route.pageInstance.template, route.pageInstance);

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

    public removeAllChildren(element: Element) {
        if (element && element.children.length) {
            for (var i = 0; i < element.children.length; i++) {
                element.removeChild(element.children[i]);
            }
        }
    }

    public diffTreeElementsAndUpdateOld(oldTreeElments: HTMLElement, newTreeElements: HTMLElement) {
        if (oldTreeElments.outerHTML !== newTreeElements.outerHTML) {
            let diff = this.diffDOM.diff(oldTreeElments, newTreeElements)
            this.diffDOM.apply(oldTreeElments, diff);
        }
    }

    private resolveTreeElements(element: HTMLElement, scope: Page): AfterElementResolved {
        let afterResolved = new AfterElementResolved();

        if (this.resolveDirectiveIf(element, scope)) {
            let forDirectiveResolved = this.resolveDirectiveFor(element, scope);
            afterResolved.jumpChilren = forDirectiveResolved.jumpChildren;
            if (!forDirectiveResolved.applied) {
                if (element.children.length > 0) {
                    for (var i = 0; i < element.children.length; i++) {
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
                this.resolveAttributes(element, scope);
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

            if (!isArray(interationArray.value)) {
                element.remove();
                console.error(`SyntaxError: Invalid expression: ${interationArray.expressionOrName} does not appear to be an array.`);
                resolved.jumpChildren = -1;
                return resolved;
            }

            let beforeElement = element;
            let index = 0;
            for (let item of interationArray.value) {
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
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = this.resolveInterpolationIfHave(node.nodeValue, scope);
            }
        });
    }

    private resolveAttributes(element: HTMLElement, scope: Page) {
        if (element.attributes.length > 0) {
            for (let i = 0; i < element.attributes.length; i++) {
                let attribute = element.attributes[i];
                let identity = attribute.name;

                if (/^\((.*?)\)$/g.test(identity)) {
                    let isRemoved = this.resolveActionAttribute(element, attribute, scope);
                    if (isRemoved) i--;
                }
                else
                    this.resolveDefaultAttribute(element, attribute, scope);
            }
        }
    }

    private resolveDefaultAttribute(element: HTMLElement, attribute: Attr, scope: Page) {
        attribute.value = this.resolveInterpolationIfHave(attribute.value, scope);
        this.resolveInterpolationsSpecificAttribute(element, attribute);
    }

    private resolveInterpolationsSpecificAttribute(element: HTMLElement, attribute: Attr) {
        this.resolveAttrInterpolationsHref(element, attribute);
    }

    private resolveAttrInterpolationsHref(element: HTMLElement, attribute: Attr): boolean {
        if (attribute.name === 'href') {
            let value = attribute.value;
            if (!value.startsWith('http:') && !value.startsWith('https:')) {
                if (Router.useHash && !value.startsWith('#') && !value.startsWith('/#'))
                    attribute.value = '#/' + value.replace(/^(\/)/g, '');
                else if (!Router.useHash) {
                    attribute.value = value.replace(/^(#)/g, '');
                    element.addEventListener('click', (e) => {
                        Router.redirect((e.target as HTMLElement).attributes['href'].value);
                        e.preventDefault();
                    });
                }
            }
            return true;
        }
        return false;
    }

    private resolveActionAttribute(element: HTMLElement, attribute: Attr, scope: Page): boolean {
        if (/^\((.*?)\)$/g.test(attribute.name)) {
            if (this.resolveClickAttribute(element, attribute, scope))
                return true;
        }
        return false;
    }

    private resolveClickAttribute(element: HTMLElement, attribute: Attr, scope: Page): boolean {
        let actionName = attribute.name.replace(/(^\()|(\)$)/g, '');
        if (actionName === 'click') {
            let value = attribute.value;

            element.addEventListener('click', (e) => {
                scope.eval(value);
                e.preventDefault();
            });

            element.removeAttribute(attribute.name);

            return true;
        }
        return false;
    }

    private resolveInterpolationIfHave(value: any, scope: Page) {
        if (value) {
            value = value.toString();
            let regex = /{{\s*[\w\ \.\$\!\%\+\-\*\/\>\<\=\'\"]+\s*}}/g;
            if (regex.test(value)) {
                value = value.replace(regex, (expression) => {
                    expression = scope.eval(expression.replace(/(^{{)|(}}$)/g, ''));
                    return expression;
                });
            }
            return value;
        }
        return '';
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


        this.checkNewRoutesRendered(commonParentRoute, highestParentRoute, currentRoute);
        this.checkOldRoutesRemoved(commonParentRoute, highestParentRoute, previousRoute);
    }

    private checkOldRoutesRemoved(commonParentRoute: Route, highestParentRoute: Route, previousRoute: Route) {
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

    private checkNewRoutesRendered(commonParentRoute: Route, highestParentRoute: Route, currentRoute: Route) {
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

export class AfterElementResolved {
    removed: boolean = false;
    jumpChilren: number = 0;
}