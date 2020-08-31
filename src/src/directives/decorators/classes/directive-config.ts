export class DirectiveConfig {
    public selector: string | string[] = '';
    public inputs?: string[] = [];
    public outputs?: string[] = [];

    constructor(obj: Partial<DirectiveConfig>) {
        Object.assign(this, obj);
    }
}