import { IScope } from '../page/interfaces/scope.interface';
import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Helper } from '../providers/helper';
import { isObject, isArray } from 'util';

@PrepareDirective({
    selector: [
        '[disabled]',
        'class',
        'style',
        'title',
        'alt',
        'type',
        'target',
        'src',
        'width',
        'height',
        'maxlength',
        'minlength',
    ]
})
export class NativesAttrsDirective extends Directive {

    constructor(private helper: Helper) {
        super();
    }

    public static get selectorsMustHavePureValue() {
        return [
            'class',
            'style',
        ];
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);

        if (selector === 'class')
            this.resolveClass(value, element, scope);
        else if (selector === 'style')
            this.resolveStyle(value, element, scope);
        else if (selector === 'disabled')
            this.resolveRequired(value, element, scope);
        else {
            if (!element.hasAttribute(selector))
                element.setAttribute(selector, value);
            else
                element.attributes[selector].value = value;
        }
    }

    public onDestroy(selector: string, scope: IScope) {
    }

    private resolveClass(value: string, element: HTMLElement, scope: IScope) {
        if (value) {
            value = value.trim();
            let classes: string[] = [];

            if (value.startsWith('{') && value.endsWith('}')) {
                let listExpressions = this.helper.splitStringJSONtoKeyValue(value);
                listExpressions.forEach((keyValue) => {
                    try {
                        if (scope.eval(keyValue.value))
                            classes.push(keyValue.key);
                    }
                    catch(e){
                        console.error(e.message);
                    }
                });
            }
            else if (value.startsWith('[') && value.endsWith(']')) {
                value = scope.eval(value);
                if (isArray(value))
                    classes = value;
            }
            else{
                value = scope.eval(value);
                if (value && typeof value === 'string') {
                    if(value.includes(' '))
                        classes = value.split(' ');
                    else
                        classes = [value];
                }
            }
            
            classes.forEach(c => element.classList.add(c));
        }
    }

    private resolveStyle(value: string, element: HTMLElement, scope: IScope) {
        if (value) {
            value = value.trim();
            if (value.startsWith('{') && value.endsWith('}')) {
                let listExpressions = this.helper.splitStringJSONtoKeyValue(value);
                listExpressions.forEach((keyValue) => {
                    try {
                        let property = keyValue.key;

                        element.style[property] = value;
                    }
                    catch(e){
                        console.error(e.message);
                    }
                });
            }
            else if (value.startsWith('[') && value.endsWith(']')) {
                value = scope.eval(value);
                if (isArray(value))
                    value.forEach((style) => {
                        if(style.includes(':')) {
                            try{
                                let property = style.split(':')[0].trim();
                                let value = style.split(':')[1].trim();
        
                                element.style[property] = value;
                            }
                            catch(e){
                                console.error(e.message);
                            }
                        }
                    });
            }
            else {
                value = scope.eval(value);
                if (value && typeof value === 'string') {
                    value = value.replace(/\;\;\;/g, ';').replace(/\;\;/g, ';');
                    if (value.includes(';')) {
                        value.split(';').forEach((style) => {
                            if(style.includes(':')) {
                                try{
                                    let property = style.split(':')[0].trim();
                                    let value = style.split(':')[1].trim();
            
                                    element.style[property] = value;
                                }
                                catch(e){
                                    console.error(e.message);
                                }
                            }
                        });
                    }
                    else if(value.includes(':')) {
                        try{
                            let property = value.split(':')[0].trim();
                            value = value.split(':')[1].trim();
    
                            element.style[property] = value;
                        }
                        catch(e){
                            console.error(e.message);
                        }
                    }
                }
            }
        }
    }

    private resolveRequired(ok: boolean, element: HTMLElement, scope: IScope) {
        if (ok)
            element.setAttribute('disabled', '');
        else
            element.removeAttribute('disabled');
    }

    public static checkSelectorMustHavePureValue(selector: string) {
        return this.selectorsMustHavePureValue.indexOf(selector.replace(/\[|\(|\]|\)/g, '')) >= 0;
    }
}