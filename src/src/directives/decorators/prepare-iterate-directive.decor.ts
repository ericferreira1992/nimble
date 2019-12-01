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
        constructor.prototype.selectors = (isArray(config.selector) ? config.selector : [config.selector]) as string[];

        if (constructor.prototype.selectors.length > 0) {
            let selectors = constructor.prototype.selectors as string[];
            selectors = selectors.filter((selector, i) => selectors.indexOf(selector) === i);
            selectors = selectors.reduce((unique, selector) => unique.includes(selector) ? unique : [...unique, selector], []);

            for(let i = 0; i < selectors.length; i++) {
                if (!selectors[i].startsWith('@'))
                    selectors[i] = `@${selectors[i]}`;
            }

            constructor.prototype.selectors = selectors;
        }

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