import { AfterIterateElement } from "../../render/directives-render";
import { IScope } from "../../page/interfaces/scope.interface";
import { Directive } from "./directive";
import { DirectivesRender } from "../../render/directives-render";

export abstract class IterationDirective extends Directive {
    abstract resolve(value: any, element: HTMLElement, scope: IScope): AfterIterateElement;

    constructor() {
        super();
    }
}