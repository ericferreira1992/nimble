import { PageConfig } from "./page-config";

export class OpenGraphConfig {
    public locale?: string;
    public url?: string;
    public title?: string;
    public siteName?: string;
    public description?: string;
    public image?: string;
    public type?: string;
    public imageWidth?: string;
    public imageHeight?: string;
    public imageType?: string;

    constructor(obj: Partial<PageConfig>) {
        Object.assign(this, obj);
    }
}