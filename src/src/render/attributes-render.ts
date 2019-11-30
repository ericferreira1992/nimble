import { NimbleApp } from './../app';;
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
        return this.allDirectives.filter(x => x['__proto__'].name === 'IterationDirective') as Type<IterationDirective>[];
    }
    public get normalDirectives() {
        let iterationDirectives = this.iterationDirectives;
        return this.allDirectives.filter(x =>
            !iterationDirectives.some(y => x === y)
        ) as Type<Directive>[];
    }

    constructor(
        private helper: Helper,
        private listenersCollector: ListenersCollector
    ) {
    }

    public processesPendingAttributes(fromRerender: boolean = false){
        for(let attributeProc of this.attrProccessPending) {
            let element = this.app.rootElement.real.querySelector(`[nimble-id="${attributeProc.procId}"]`) as HTMLElement;
            if (element) {
                this.listenersCollector.unsubscribeAllFromElement(element);
                    
                for(let process of attributeProc.processes) {
                    if (process instanceof DirectiveExecute) {
                        let directive = NimbleApp.inject(process.directive) as Directive;
                        process.applicables.forEach((applicable) => {
                            directive.resolve(applicable.selector, applicable.content, element, process.scope);
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

    private addAttributeToProcess(currentElement: HTMLElement, procExec: AttrProcExecute | DirectiveExecute) {
        let attributeProcess = this.attrProccessPending.find(x => x.originalElement === currentElement);

        if (!attributeProcess) {
            attributeProcess = new AttributeToProcess();
            attributeProcess.originalElement = currentElement;
            attributeProcess.procId = this.helper.uid();

            if (!currentElement.hasAttribute('nimble-id'))
                currentElement.setAttribute('nimble-id', attributeProcess.procId);
            else
                (currentElement.attributes['nimble-id'] as Attr).value = attributeProcess.procId;

            attributeProcess.processes.push(procExec);
            this.attrProccessPending = [attributeProcess, ...this.attrProccessPending];
        }
        else {
            let sameProcess: DirectiveExecute = (procExec instanceof DirectiveExecute)
                ? (attributeProcess.processes.filter(x => x instanceof DirectiveExecute).find(p => (p as DirectiveExecute).directive.name === procExec.directive.name) as DirectiveExecute)
                : null;
    
            if (sameProcess) {
                let applicable = (procExec as DirectiveExecute).applicables[0];
                if (!sameProcess.applicables.some(x => x.selector === applicable.selector))
                    sameProcess.applicables.push(applicable);
            }
            else
                attributeProcess.processes = [procExec, ...attributeProcess.processes];
        }
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

            if (i < -1)
                break;
        }
    }

    public resolveElement(element: HTMLElement, scope: IScope): AfterIterateElement {
        let afterIterate = this.resolveIterateDirective(element, scope);

        if (!afterIterate.removed) {
            if (!afterIterate.resolvedAllElements) {
                if (element.children.length > 0) {
                    this.resolveChildren(element.children, scope);
                }

                this.resolveInsideText(element, scope);
                this.resolveNormalDirectives(element, scope);
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

    private resolveNormalDirectives(element: HTMLElement, scope: IScope) {
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
                        applicables: [{ selector: directive.selector, content: value }],
                        scope: scope,
                        directive: directive.directive
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
    directive: Type<Directive>;
    scope: IScope;
    applicables: { selector: string, content: any }[];
    afterExecute?: (element: HTMLElement) => void;

    constructor(obj?: Partial<DirectiveExecute>) {
        if (obj) Object.assign(this, obj);
    }
}