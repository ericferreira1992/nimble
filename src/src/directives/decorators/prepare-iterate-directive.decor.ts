import { DirectiveIterateConfig } from './classes/iterate-directive-config';
import { Directive } from '../abstracts/directive';
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';
import 'reflect-metadata';

export function PrepareIterateDirective(config: DirectiveIterateConfig) {
    return function <T extends { new(...args: any[]): Directive }>(constructor: T) {
        config = new DirectiveIterateConfig(config);
        Object.assign(constructor.prototype, config);

        if (constructor.prototype.selector) {
            if (!constructor.prototype.selector.startsWith('@'))
                constructor.prototype.selector = `@${constructor.prototype.selector}`;
        }
        
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, constructor);
        return constructor;
    }
}