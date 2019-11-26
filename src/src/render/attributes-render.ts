import { NimbleApp } from './../app';
import { Router } from '../route/router';
import { isNullOrUndefined } from 'util';
import { IScope } from '../page/interfaces/scope.interface';
import { IterationDirective } from '../directives/abstracts/iteration-directive';
import { Directive } from '../directives/abstracts/directive';
import { Type } from '../inject/type.interface';
import { Injectable } from '../inject/injectable';
import { Helper } from '../providers/helper';

@Injectable({ single: true })
export class AttributesRender {

    private attrProccessPending: AttributeToProcess[] = [];
    
    private get app() { return NimbleApp.instance; }

    public get allDirectives() { return this.app.directives; }
    public get iterationDirectives() { return this.allDirectives.filter(x => x['__proto__'].name === 'IterationDirective'); }
    public get normalDirectives() {
        let iterationDirectives = this.iterationDirectives;
        return this.allDirectives.filter(x =>
            !iterationDirectives.some(y => x === y)
        );
    }

    constructor(
        private helper: Helper
    ) {
    }

    public processesPendingAttributes(fromRerender: boolean = false){
        for(let attributeProc of this.attrProccessPending) {
            let element = this.app.rootElement.real.querySelector(`[nimble-id="${attributeProc.procId}"]`) as HTMLElement;
            if (element) {
                if (fromRerender && attributeProc.originalElement) {
                    let newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                    element = newElement as HTMLElement;
                }
                    
                for(let process of attributeProc.processes) {
                    if (process instanceof DirectiveExecute)
                        process.directive.resolve(process.content, element, attributeProc.scope);
                    else
                        process.action(element, element.attributes[process.attr], process.content, attributeProc.scope);
                }

                element.removeAttribute('nimble-id');
            }
        }
        this.clearPendingAttributesToProcess();
    }

    private addAttributeToProcess(currentElement: HTMLElement, scope: IScope, procExec: AttrProcExecute | DirectiveExecute) {
        let attributeProcess = this.attrProccessPending.find(x => x.originalElement === currentElement);

        if (!attributeProcess) {
            attributeProcess = new AttributeToProcess();
            attributeProcess.originalElement = currentElement;
            attributeProcess.scope = scope;
            attributeProcess.procId = this.helper.uid();

            if (!currentElement.hasAttribute('nimble-id'))
                currentElement.setAttribute('nimble-id', attributeProcess.procId);
            else
                (currentElement.attributes['nimble-id'] as Attr).value = attributeProcess.procId;

            this.attrProccessPending.push(attributeProcess);
        }

        attributeProcess.processes.push(procExec);
    }

    public clearPendingAttributesToProcess(){
        this.attrProccessPending = [];
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
            let attributes = [];
            for (let i = 0; i < element.attributes.length; i++)
                attributes.push(element.attributes[i]);

            for(let attribute of attributes) {
                let name = attribute.name;

                let directive = this.normalDirectives.find(x => name === x.prototype.selector);
                if (directive) {
                    let value = attribute.value;

                    if (/^\[([^)]+)\]$/g.test(name))
                        value = scope.eval(value);
                    else
                        value = this.resolveInterpolationIfHave(value, scope);

                    this.addAttributeToProcess(element, scope, new DirectiveExecute({
                        directive: NimbleApp.inject(directive) as Directive,
                        content: value
                    }));
                    
                    element.removeAttribute(name);
                }
                else {
                    this.resolveDefaultAttribute(element, attribute, scope);
                }
            }
        }
    }

    private resolveDefaultAttribute(element: HTMLElement, attribute: Attr, scope: IScope) {
        let name = attribute.name;
        let value = attribute.value;

        if (/^\[([^)]+)\]$/g.test(name)) {
            element.removeAttribute(name);
            name = name.substr(1, name.length - 2);
            if (name) {
                value = scope.eval(value);
                element.setAttribute(name, value);
                attribute = element.attributes[name];
            }
            else
                return;
        }
        else
            attribute.value = this.resolveInterpolationIfHave(attribute.value, scope);

        this.resolveSpecialAttributes(element, attribute);
    }

    private resolveSpecialAttributes(element: HTMLElement, attribute: Attr) {
        this.resolveAttrHref(element, attribute);
    }

    private resolveAttrHref(element: HTMLElement, attribute: Attr) {
        if (attribute.name === 'href') {
            let value = attribute.value;
            if (!value.startsWith('http:') && !value.startsWith('https:')) {
                this.addAttributeToProcess(element, null, new AttrProcExecute({
                    attr: attribute.name,
                    content: value,
                    action: (element: HTMLElement) => {
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
                                return false;
                            });
                        }
                    }
                }));
            }
        }
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

export class AttributeToProcess {
    procId: string;
    originalElement: HTMLElement;
    scope: IScope;
    processes?: (AttrProcExecute | DirectiveExecute)[] = [];

    constructor(obj?: Partial<AttributeToProcess>) {
        if (obj) Object.assign(this, obj);

        if (this.processes && this.processes.length)
            this.processes = this.processes.map(x => new AttrProcExecute(x));
    }
}

export class AttrProcExecute {
    attr: string;
    content: any;
    action: (element: HTMLElement, attr: Attr, content: any, scope: IScope) => void;

    constructor(obj?: Partial<AttrProcExecute>) {
        if (obj) Object.assign(this, obj);
    }
}

export class DirectiveExecute {
    content: any;
    directive: Directive;

    constructor(obj?: Partial<DirectiveExecute>) {
        if (obj) Object.assign(this, obj);
    }
}