import { IterateDirectiveResponse } from "../../render/render-abstract";
import { Directive } from "./directive";

export abstract class IterationDirective extends Directive {
    abstract onIterate(): IterateDirectiveResponse[];

    constructor() {
        super();
    }
}