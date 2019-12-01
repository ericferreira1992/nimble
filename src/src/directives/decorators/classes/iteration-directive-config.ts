import { DirectiveConfig } from "./directive-config";

export class DirectiveIterationConfig extends DirectiveConfig {

    constructor(obj: Partial<DirectiveIterationConfig>) {
        super(obj);
        Object.assign(this, obj);
    }
}