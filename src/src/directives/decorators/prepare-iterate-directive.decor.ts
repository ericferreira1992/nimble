import { DirectiveIterationConfig } from './classes/iteration-directive-config';
import { Directive } from '../abstracts/directive';
import { IterationDirective } from "../../directives/abstracts/iteration-directive";
import { Type } from "../../inject/type.interface";
import { isArray } from 'util';
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';
import 'reflect-metadata';

export function PrepareIterateDirective(config: DirectiveIterationConfig) {
    return function <T extends { new(...args: any[]): Directive }>(constructor: T) {
        config = new DirectiveIterationConfig(config);
        constructor.prototype.type = 'IterationDirective';
        constructor.prototype._selectors = (isArray(config.selector) ? Array.from(new Set(config.selector)) : (config.selector ? [config.selector] : [])).map(x => !x.startsWith('@') ? `@${x}` : x);
        constructor.prototype._inputs = config.inputs ?? [];
        constructor.prototype._outputs = config.outputs ?? [];

        constructor.prototype.validate = (addedDirectives: (Type<Directive | IterationDirective>)[]) => {
            let selector = constructor.prototype.selector;
            let name = constructor.name;
            if (selector) {
            }
        };
        
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, constructor);
        return constructor;
    }
}