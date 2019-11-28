import { AfterIterateElement } from "../../render/attributes-render";
import { IScope } from "../../page/interfaces/scope.interface";
import { Directive } from "./directive";

export abstract class IterationDirective extends Directive {
    abstract resolve(selector: string, value: any, element: HTMLElement, scope: IScope): AfterIterateElement;

    constructor() {
        super();
    }
}