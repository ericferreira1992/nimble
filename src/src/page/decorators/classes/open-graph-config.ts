import { PageConfig } from "./page-config";

export class OpenGraphConfig {
    public locale?: string;
    public url?: string;
    public title?: string;
    public site_name?: string;
    public description?: string;
    public image?: string;

    constructor(obj: Partial<PageConfig>) {
        Object.assign(this, obj);
    }
}