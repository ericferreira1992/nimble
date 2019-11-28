export class DirectiveConfig {
    public selector: string | string[] = '';

    constructor(obj: Partial<DirectiveConfig>) {
        Object.assign(this, obj);
    }
}