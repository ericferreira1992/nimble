import { IScope } from "../../page/interfaces/scope.interface";

export abstract class Directive {
    public selectors: string[];

    constructor() {
    }

    pureSelector(selector: string): string {
        return selector.replace(/\[|\(|\]|\)/g, '');
    }

    abstract resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void;
}