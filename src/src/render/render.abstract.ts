import { HeaderRender } from "./header-render";
import { AttributesRender } from "./attributes-render";
import { NimbleApp } from "./../app";
import { DiffDOM } from "./diff-dom";

export abstract class Render {
    protected get app() { return NimbleApp.instance; }

    protected diffDOM: DiffDOM = new DiffDOM();

    constructor(
        protected headerRender: HeaderRender,
        protected attributesRender: AttributesRender
    ) {
    }

    protected checkElementAlreadyRendered(element: HTMLElement, targetElement: HTMLElement) {
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

    public removeAllChildren(element: Element) {
        if (element && element.children.length) {
            for (var i = 0; i < element.children.length; i++) {
                element.removeChild(element.children[i]);
            }
        }
    }

    public diffTreeElementsAndUpdateOld(oldTreeElments: HTMLElement, newTreeElements: HTMLElement) {

        let currentElement: HTMLElement;
        if (oldTreeElments.outerHTML !== newTreeElements.outerHTML) {
            currentElement = this.diffDOM.diff(oldTreeElments, newTreeElements);
        }

        return { element: currentElement, executedsDirectives: this.attributesRender.processesPendingAttributes() };
    }
}