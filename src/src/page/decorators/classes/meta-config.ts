import { OpenGraphConfig } from "./open-graph-config";

export class MetaConfig {
    public description: string = '';
    public keywords: string = '';
    public og: Partial<OpenGraphConfig> = {};

    constructor(obj: Partial<MetaConfig>) {
        Object.assign(this, obj);

        if (this.og)
            this.og = new OpenGraphConfig(this.og);
    }
}