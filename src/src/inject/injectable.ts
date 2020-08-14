import { Type } from './type.interface';
import 'reflect-metadata';

export const INJECTABLE_METADATA_KEY = Symbol('INJECTABLE_KEY');

export function Injectable(config?: ProviderConfig) {
    return function (target: any) {
        if (config)
            Object.assign(target.prototype, config);

        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
        return target;
    };
}

export function isInjectable<T>(target: Type<T>) {
    return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) === true;
}

export class ProviderConfig {

    /**Creates only one instance to use for all injections */
    single: boolean = false;

}