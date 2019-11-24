import { DirectiveConfig } from "./directive-config";

export class DirectiveIterateConfig extends DirectiveConfig {

    constructor(obj: Partial<DirectiveIterateConfig>) {
        super(obj);
        Object.assign(this, obj);
    }
}