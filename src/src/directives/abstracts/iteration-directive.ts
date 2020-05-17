import { IterateDirectiveResponse } from "../../render/render-abstract";
import { IScope } from "../../page/interfaces/scope.interface";
import { Directive } from "./directive";

export abstract class IterationDirective extends Directive {
    abstract resolve(selector: string, value: any, element: HTMLElement, scope: IScope): IterateDirectiveResponse[];

    constructor() {
        super();
    }
}