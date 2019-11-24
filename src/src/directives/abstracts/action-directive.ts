import { AfterIterateElement } from "../../render/directives-render";
import { IScope } from "../../page/interfaces/scope.interface";
import { Directive } from "./directive";

export abstract class ActionDirective extends Directive {
    abstract resolve(value: string, element: HTMLElement, scope: IScope): AfterIterateElement;
}