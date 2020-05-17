import { DirectiveConfig } from './classes/directive-config';
import { Directive } from '../abstracts/directive';
import { IterationDirective } from "../../directives/abstracts/iteration-directive";
import { Type } from "../../inject/type.interface";
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';
import 'reflect-metadata';
import { isArray } from 'util';

export function PrepareDirective(config: DirectiveConfig) {

    return function <T extends { new(...args: any[]): Directive }>(constructor: T) {
        config = new DirectiveConfig(config);
        constructor.prototype.type = 'Directive';
        constructor.prototype.selectors = (isArray(config.selector) ? config.selector : [config.selector]) as string[];

        if (constructor.prototype.selectors.length > 0) {
            let selectors = constructor.prototype.selectors as string[];
            selectors = selectors.filter((selector, i) => selectors.indexOf(selector) === i);
            constructor.prototype.selectors = selectors.reduce((unique, selector) => unique.includes(selector) ? unique : [...unique, selector], []);
        }

        constructor.prototype.validate = (addedDirectives: (Type<Directive | IterationDirective>)[]) => {
            let selectors = constructor.prototype.selectors as string[];
            let name = constructor.name;
            if (selectors && selectors.length) {
                let regexValidates = [
                    /^(\[).*(\])$/g,
                    /^(\().*(\))$/g,
                    /^[a-zA-Z].*[a-zA-Z]$/g
                ];

                for (let selector of selectors) {
                    if (!regexValidates.some(regex => !regex.test(selector)))
                        throw Error(`The ${name} has invalid selector: "${selector}".`);
                    else if (addedDirectives.some(added => added === constructor))
                        throw Error(`The ${name} is already added.`);
                    else {
                        let equalSelector = addedDirectives.find(added => added.prototype.selectors.some(x => x === selector));
                        if (equalSelector)
                            throw Error(`The ${name} has selector equals another directive already added. The another directive is: ${equalSelector.name}`);
                    }
                }
            }
        };
        
        Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, constructor);
        return constructor;
    }
}