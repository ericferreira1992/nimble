import 'reflect-metadata';
import { isArray } from 'util';
import { DirectiveConfig } from './classes/directive-config';
import { Directive } from '../abstracts/directive';
import { IterationDirective } from "../../directives/abstracts/iteration-directive";
import { Type } from "../../inject/type.interface";
import { INJECTABLE_METADATA_KEY } from '../../inject/injectable';

export function PrepareDirective(config: DirectiveConfig) {

    return function <T extends { new(...args: any[]): Directive }>(constructor: T) {
        config = new DirectiveConfig(config);
        constructor.prototype.type = 'Directive';
        constructor.prototype._selectors = isArray(config.selector) ? Array.from(new Set(config.selector)) : (config.selector ? [config.selector] : []);
        constructor.prototype._inputs = config.inputs ?? [];
        constructor.prototype._outputs = config.outputs ?? [];

        constructor.prototype.validate = (addedDirectives: (Type<Directive | IterationDirective>)[]) => {
            let selectors = constructor.prototype._selectors as string[];
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
                        let equalSelector = addedDirectives.find(added => added.prototype._selectors.some(x => x === selector));
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