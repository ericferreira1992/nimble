import { IScope } from "../../page/interfaces/scope.interface";
import { DirectivesRender } from "../../render/directives-render";

export abstract class Directive {
    public selector: string;

    constructor() {
    }

    abstract resolve(value: any, element: HTMLElement, scope: IScope): void;
}