import { PageConfig } from './classes/page-config';
import { Page } from '../page';

export function PreparePage(options: PageConfig) {
    return function <T extends { new(...args: any[]): Page }>(constructor: T) {
        options = new PageConfig(options);
        Object.assign(constructor.prototype, options);
    }
}