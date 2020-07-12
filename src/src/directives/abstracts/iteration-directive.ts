import { IterateDirectiveResponse } from "../../render/render-abstract";
import { IScope } from "../../page/interfaces/scope.interface";
import { Directive } from "./directive";

export abstract class IterationDirective extends Directive {
    abstract onResolve(selector: string, value: any): IterateDirectiveResponse[];

    constructor() {
        super();
    }
}