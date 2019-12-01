import { IScope } from "../../page/interfaces/scope.interface";

export abstract class Directive {
    public selectors: string[];

    public selectorsApplied: {
        selector: string,
        content: any
    }[] = [];

    public others: Directive[] = [];

    public element: HTMLElement;

    constructor() {
    }

    /** Returns the value matched to the selector if it was entered */
    public getValueOfSelector(selector: string) {
        selector = this.pureSelector(selector);
        let selectorApplied = this.selectorsApplied.find(x => this.pureSelector(x.selector) === selector);
        if (selectorApplied) return selectorApplied.content;
        return null;
    }

    /** Anothers directives can be applies in the same element. 
     * This method returns a directive searching for its selector name */
    public getDirectiveBySelector(selector: string) {
        selector = this.pureSelector(selector);
        return this.others.find(x => x.selectorsApplied.some(y => this.pureSelector(y.selector) === selector));
    }

    /** Return the selector without parentheses and bracket */
    public pureSelector(selector: string): string {
        return selector.replace(/\[|\(|\]|\)/g, '');
    }

    abstract resolve(selector: string, value: any, element: HTMLElement, scope: IScope): any;
}

export class ResolverData {
    public selector: string;
    public content: any;
}