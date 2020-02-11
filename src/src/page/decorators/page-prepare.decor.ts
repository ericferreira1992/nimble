import { PageConfig } from './classes/page-config';
import { Page } from '../page';
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';
import 'reflect-metadata';

export function PreparePage(options: PageConfig) {
    return function <T extends { new(...args: any[]): Page }>(constructor: T) {
        options = new PageConfig(options);
        Object.assign(constructor.prototype, options);
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, constructor);
        return constructor;
    }
}