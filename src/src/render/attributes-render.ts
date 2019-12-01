import { NimbleApp } from './../app';
import { IScope } from '../page/interfaces/scope.interface';
import { IterationDirective } from '../directives/abstracts/iteration-directive';
import { Directive } from '../directives/abstracts/directive';
import { DirectiveHelper } from '../directives/directive.helper';
import { Type } from '../inject/type.interface';
import { Injectable } from '../inject/injectable';
import { Helper } from '../providers/helper';
import { ListenersCollector } from '../providers/listeners-collector';

@Injectable({ single: true })
export class AttributesRender {

    private attrProccessPending: AttributeToProcess[] = [];
    
    private get app() { return NimbleApp.instance; }

    public get allDirectives() { return this.app.directives; }
    public get iterationDirectives() {
        return this.allDirectives.filter(x => x.prototype.type === 'IterationDirective') as Type<IterationDirective>[];
    }
    public get normalDirectives() {
        return this.allDirectives.filter(x => x.prototype.type === 'Directive') as Type<Directive>[];
    }

    constructor(
        private helper: Helper,
        private listenersCollector: ListenersCollector
    ) {
    }

    public processesPendingAttributes(){
        for(let attributeProc of this.attrProccessPending) {
            let element = this.app.rootElement.real.querySelector(`[nimble-id="${attributeProc.procId}"]`) as HTMLElement;
            
            if (element) {
                this.listenersCollector.unsubscribeAllFromElement(element);
                    
                for(let process of attributeProc.processes) {
                    if (process instanceof DirectiveExecute) {
                        process.directiveInstance.others = attributeProc.processes.filter(x => {
                            return x instanceof DirectiveExecute && x.directiveType !== (process as DirectiveExecute).directiveType;
                        }).map(x => (x as DirectiveExecute).directiveInstance);
                        process.directiveInstance.element = element;

                        process.applicables.forEach((applicable) => {
                            if (applicable.beforeResolves) applicable.beforeResolves();
                            
                            (process as DirectiveExecute).directiveInstance
                                .resolve(applicable.selector, applicable.content, element, process.scope);

                            this.listenersCollector.addActionsInElementsListeners(element, applicable.beforeResolves, applicable.afterResolves)
                            
                            if (applicable.afterResolves) applicable.afterResolves();
                        });
                    }
                    else
                        process.action(element, element.attributes[process.attr], process.content, process.scope);
                }

                element.removeAttribute('nimble-id');
            }
        }
        this.clearPendingAttributesToProcess();
    }

    private addAttributeToProcess(currentElement: HTMLElement, process: AttrProcExecute | DirectiveExecute) {
        let attributeProcess = this.attrProccessPending.find(x => x.originalElement === currentElement);

        if (!attributeProcess) {
            attributeProcess = new AttributeToProcess();
            attributeProcess.originalElement = currentElement;
            attributeProcess.procId = this.helper.uid();

            if (!currentElement.hasAttribute('nimble-id'))
                currentElement.setAttribute('nimble-id', attributeProcess.procId);
            else
                (currentElement.attributes['nimble-id'] as Attr).value = attributeProcess.procId;

            if (process instanceof DirectiveExecute){
                process.directiveInstance = NimbleApp.inject(process.directiveType) as Directive;
                process.directiveInstance.selectorsApplied.push({
                    selector: process.applicables[0].selector,
                    content: process.applicables[0].content,
                });
            }

            attributeProcess.processes.push(process);

            this.attrProccessPending = [attributeProcess, ...this.attrProccessPending];
        }
        else {
            let sameProcess: DirectiveExecute = null;
            
            if (process instanceof DirectiveExecute)
                sameProcess = attributeProcess.processes.filter(x => x instanceof DirectiveExecute)
                                                        .find(p => (p as DirectiveExecute).directiveType === process.directiveType) as DirectiveExecute;
    
            if (sameProcess) {
                let applicable = (process as DirectiveExecute).applicables[0];
                if (!sameProcess.applicables.some(x => x.selector === applicable.selector)) {
                    sameProcess.applicables.push(applicable);
                    sameProcess.directiveInstance.selectorsApplied.push({
                        selector: applicable.selector,
                        content: applicable.content,
                    });
                }
            }
            else {
                if (process instanceof DirectiveExecute) {
                    process.directiveInstance = NimbleApp.inject(process.directiveType) as Directive;
                    process.directiveInstance.selectorsApplied.push({
                        selector: process.applicables[0].selector,
                        content: process.applicables[0].content,
                    });
                }

                attributeProcess.processes = [process, ...attributeProcess.processes];
            }
        }
    }

    public clearPendingAttributesToProcess(){
        this.attrProccessPending = [];
    }

    public resolveChildren(elements: HTMLCollection, scope: IScope, beforeResolves?: () => void, afterResolves?: () => void) {
        for (var i = 0; i < elements.length; i++) {
            let child = elements[i] as HTMLElement;
            let childAfterResolved = this.resolveElement(child, scope, beforeResolves, afterResolves);

            if (childAfterResolved.removed)
                i--;
            if (childAfterResolved.quantityNewChild !== 0)
                i += childAfterResolved.quantityNewChild;

            if (i < -1)
                break;
        }
    }

    public resolveElement(element: HTMLElement, scope: IScope, beforeResolves?: () => void, afterResolves?: () => void): AfterIterateElement {
        let afterIterate = this.resolveIterateDirective(element, scope);

        if (!afterIterate.removed) {
            if (!afterIterate.resolvedAllElements) {
                if (beforeResolves) beforeResolves();

                if (element.children.length > 0) {
                    this.resolveChildren(element.children, scope, beforeResolves, afterResolves);
                }

                this.resolveInsideText(element, scope);
                this.resolveNormalDirectives(element, scope, beforeResolves, afterResolves);

                if (afterResolves) afterResolves();
            }
        }

        return afterIterate;
    }

    private resolveIterateDirective(element: HTMLElement, scope: IScope): AfterIterateElement {
        let directive = this.getTheIterateDirectiveCanBeApply(element);
        if (directive) {
            let selector = directive.selectors.find(selector => element.hasAttribute(selector));
            let value = element.attributes[selector].value;
            element.removeAttribute(selector);
            let afterIterate = directive.resolve(selector, value, element, scope);
            return afterIterate;
        }
        return new AfterIterateElement();
    }

    private getTheIterateDirectiveCanBeApply(element: HTMLElement): IterationDirective {
        let directives: {selector: string, directive: Type<IterationDirective>}[] = [];
        for(let directive of this.iterationDirectives.filter(x => x.prototype.selectors && x.prototype.selectors.length > 0)) {
            let selectors = directive.prototype.selectors as string[];

            for (let i = 0; i < element.attributes.length; i++) {
                let applySelector = selectors.find(selector => selector.toLowerCase() === element.attributes[i].name);
                if (applySelector) {
                    directives.push({
                        selector: applySelector,
                        directive: directive as Type<IterationDirective>
                    });
                    break;
                }
            }
        }

        if (directives.length > 0) {
            if (directives.length > 1) {
                let selectors = directives.map(dir => dir.selector).join(', ');
                console.warn(`Were found more than one iteration directives to the same element, but did apply the first only. The directives are: ${selectors}.`);

                directives.slice(1).forEach((dir) => {
                    element.removeAttribute(dir.directive.prototype.selector);
                });
            }

            let instance = NimbleApp.inject(directives[0].directive);
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

    private resolveNormalDirectives(element: HTMLElement, scope: IScope, beforeResolves?: () => void, afterResolves?: () => void) {
        if (element.attributes.length > 0) {
            let attributes = [];
            for (let i = 0; i < element.attributes.length; i++)
                attributes.push(element.attributes[i]);

            for(let attribute of attributes) {
                let name = attribute.name;
                let directive:{selector: string, directive: Type<Directive>} = null;

                for(let x of this.normalDirectives) {
                    let selectors = x.prototype.selectors as string[];
                    let selector = selectors.find(selector => {
                        if (selector) {
                            selector = selector.toLowerCase();
                            if (/^\[([^)]+)\]$/g.test(name) && /^(?!\(\/).*(?<!\))$/g.test(selector))
                                return name === `[${selector.replace(/\[|\]/g, '')}]`;
                            else
                                return name === selector;
                        }
                        return false;
                    });

                    if (selector) {
                        directive = { selector: selector, directive: x };
                        break;
                    }
                }

                if (directive) {
                    let value = attribute.value;

                    if (!/^\(([^)]+)\)$/g.test(name)) {
                        if (/^\[([^)]+)\]$/g.test(name)) {
                            if (!DirectiveHelper.checkSelectorMustHavePureValue(name))
                                value = scope.eval(value);
                        }
                        else {
                            value = this.resolveInterpolationIfHave(value, scope);
                            if (DirectiveHelper.checkSelectorMustHavePureValue(name)) {
                                attribute.value = value;
                                continue;
                            }
                        }
                    }

                    this.addAttributeToProcess(element, new DirectiveExecute({
                        applicables: [{
                            selector: directive.selector,
                            content: value,
                            beforeResolves,
                            afterResolves
                        }],
                        scope: scope,

                        directiveType: directive.directive
                    }));
                    
                    element.removeAttribute(name);
                }
                else
                    this.resolveDefaultAttribute(element, attribute, scope);
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
        // this.resolveAttrHref(element, attribute);
    }

    private resolveInterpolationIfHave(value: any, scope: IScope) {
        if (value) {
            value = value.toString().trim();
            let regex = /{{\s*[\w\ \.\$\!\?\:\%\+\-\*\/\>\<\=\'\']+\s*}}/g;
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
    resolvedAllElements: boolean;
    removed: boolean = false;
    quantityNewChild: number = 0;

    beforeResolves: () => void;
    afterResolves: () => void;

    constructor(obj?: Partial<AfterIterateElement>) {
        if (obj) Object.assign(this, obj);
    }
}

export class AttributeToProcess {
    procId: string;
    originalElement: HTMLElement;
    processes?: (AttrProcExecute | DirectiveExecute)[] = [];

    constructor(obj?: Partial<AttributeToProcess>) {
        if (obj) Object.assign(this, obj);
    }
}

export class AttrProcExecute {
    attr: string;
    content: any;
    scope: IScope;
    action: (element: HTMLElement, attr: Attr, content: any, scope: IScope) => void;

    constructor(obj?: Partial<AttrProcExecute>) {
        if (obj) Object.assign(this, obj);
    }
}

export class DirectiveExecute {
    directiveType: Type<Directive>;
    directiveInstance: Directive;
    scope: IScope;
    applicables: {
        selector: string,
        content: any,
        beforeResolves: () => void,
        afterResolves: () => void
    }[];
    afterExecute?: (element: HTMLElement) => void;

    constructor(obj?: Partial<DirectiveExecute>) {
        if (obj) Object.assign(this, obj);
    }
}