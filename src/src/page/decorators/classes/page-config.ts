import { MetaConfig } from "./meta-config";

export class PageConfig {
    public template: string = '';
    public style?: string = '';
    public title?: string = '';
    public meta?: Partial<MetaConfig> = {};

    constructor(obj: Partial<PageConfig>) {
        Object.assign(this, obj);

        if (this.meta)
            this.meta = new MetaConfig(this.meta);
    }
}