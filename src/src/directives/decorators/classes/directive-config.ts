export class DirectiveConfig {
    public selector: string = '';

    constructor(obj: Partial<DirectiveConfig>) {
        Object.assign(this, obj);
    }
}