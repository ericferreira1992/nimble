import { NimbleApp } from './../app';
import { Router } from '../route/router';
import { isNullOrUndefined, isArray } from 'util';
import { IScope } from '../page/interfaces/scope.interface';
import { IterationDirective } from '../directives/abstracts/iteration-directive';
import { Type } from '../inject/type.interface';
import { Injectable } from '../inject/injectable';

@Injectable()
export class DirectivesRender {
    
    private get app() { return NimbleApp.instance; }

    public get allDirectives() { return this.app.directives; }
    public get iterationDirectives() { return this.allDirectives.filter(x => x['__proto__'].name === 'IterationDirective'); }
    public get normalDirectives() {
        let iterationDirectives = this.iterationDirectives;
        return this.allDirectives.filter(x =>
            !iterationDirectives.some(y => x === y)
        );
    }

    constructor() {
    }

    public resolveChildren(elements: HTMLCollection, scope: IScope) {
        for (var i = 0; i < elements.length; i++) {
            let child = elements[i] as HTMLElement;
            let childAfterResolved = this.resolveElement(child, scope);

            if (childAfterResolved.removed)
                i--;
            if (childAfterResolved.quantityNewChild !== 0)
                i += childAfterResolved.quantityNewChild;

            if (i < 0)
                break;
        }
    }

    public resolveElement(element: HTMLElement, scope: IScope): AfterIterateElement {
        let afterIterate = this.resolveIterateDirective(element, scope);

        if (!afterIterate.removed) {
            if (element.children.length > 0) {
                this.resolveChildren(element.children, scope);
            }

            this.resolveInsideText(element, scope);
            this.resolveNormalDirectives(element, scope);
        }

        return afterIterate;
    }

    private resolveIterateDirective(element: HTMLElement, scope: IScope): AfterIterateElement {
        let directive = this.getTheIterateDirectiveCanBeApply(element);
        if (directive) {
            let value = element.attributes[directive.selector].value;
            element.removeAttribute(directive.selector);
            let afterIterate = directive.resolve(value, element, scope);
            return afterIterate;
        }
        return new AfterIterateElement();
    }

    private getTheIterateDirectiveCanBeApply(element: HTMLElement): IterationDirective {
        let directives: Type<IterationDirective>[] = [];
        for(let directive of this.iterationDirectives.filter(x => !isNullOrUndefined(x.prototype.selector) && x.prototype.selector !== '')) {
            if (element.attributes[directive.prototype.selector]) {
                directives.push(directive as Type<IterationDirective>);
            }
        }

        if (directives.length > 0) {
            if (directives.length > 1) {
                let selectors = directives.map(dir => dir.prototype.selector).join(', ');
                console.warn(`Were found more than one iteration directives to the same element, but did apply the first only. The directives are: ${selectors}.`);

                directives.slice(1).forEach((dir) => {
                    element.removeAttribute(dir.prototype.selector);
                });
            }

            let instance = NimbleApp.inject(directives[0]);
            return instance;
        }
        return null;
    }

    private resolveInsideText(element: HTMLElement, scope: IScope) {
        element.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = this.resolveInterpolationIfHave(node.nodeValue, scope);
            }
        });
    }

    private resolveNormalDirectives(element: HTMLElement, scope: IScope) {
        if (element.attributes.length > 0) {
            for (let i = 0; i < element.attributes.length; i++) {
                let attribute = element.attributes[i];
                let identity = attribute.name;

                let directive = this.normalDirectives.find(x => identity === x.prototype.selector);
                if (directive) {
                    let instance = NimbleApp.inject(directive);
                    instance.resolve(attribute.value, element, scope);
                    element.removeAttribute(identity);
                    i--;
                }
                else {
                    this.resolveDefaultAttribute(element, attribute, scope); 
                }
            }
        }
    }

    private resolveDefaultAttribute(element: HTMLElement, attribute: Attr, scope: IScope) {
        attribute.value = this.resolveInterpolationIfHave(attribute.value, scope);
        this.resolveInterpolationsSpecificAttribute(element, attribute);
    }

    private resolveInterpolationsSpecificAttribute(element: HTMLElement, attribute: Attr) {
        this.resolveAttrInterpolationsHref(element, attribute);
    }

    private resolveAttrInterpolationsHref(element: HTMLElement, attribute: Attr): boolean {
        if (attribute.name === 'href') {
            let value = attribute.value;
            if (!value.startsWith('http:') && !value.startsWith('https:')) {
                if (Router.useHash && !value.startsWith('#') && !value.startsWith('/#'))
                    attribute.value = '#/' + value.replace(/^(\/)/g, '');
                else if (!Router.useHash) {
                    attribute.value = value.replace(/^(#)/g, '');
                    element.addEventListener('click', (e) => {
                        let attr = element.attributes['href'];
                        if (attr) {
                            Router.redirect(attr.value);
                        }
                        e.preventDefault();
                    });
                }
            }
            return true;
        }
        return false;
    }

    private resolveClickAttribute(element: HTMLElement, attribute: Attr, scope: IScope): boolean {
        let actionName = attribute.name.replace(/(^\()|(\)$)/g, '');
        if (actionName === 'click') {
            let value = attribute.value;

            element.addEventListener('click', (e) => {
                scope.eval(value);
                e.preventDefault();
            });

            element.removeAttribute(attribute.name);

            return true;
        }
        return false;
    }

    private resolveInterpolationIfHave(value: any, scope: IScope) {
        if (value) {
            value = value.toString();
            let regex = /{{\s*[\w\ \.\$\!\%\+\-\*\/\>\<\=\'\']+\s*}}/g;
            if (regex.test(value)) {
                value = value.replace(regex, (expression) => {
                    expression = scope.eval(expression.replace(/(^{{)|(}}$)/g, ''));
                    return expression;
                });
            }
            return value;
        }
        return '';
    }
}

export class AfterIterateElement {
    removed: boolean = false;
    quantityNewChild: number = 0;

    constructor(obj?: Partial<AfterIterateElement>) {
        if (obj) Object.assign(this, obj);
    }
}