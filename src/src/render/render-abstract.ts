import { ElementStructure } from "./element-structure";
import { Directive } from "../directives/abstracts/directive";
import { Type } from "../inject/type.interface";
import { NimbleApp } from "../app";
import { IterationDirective } from "../directives/abstracts/iteration-directive";
import { Injectable } from "../inject/injectable";
import { ElementIterationStructure } from "./element-iteration-structure";
import { DirectiveHelper } from "../directives/directive.helper";
import { ListenersCollector } from "../providers/listeners-collector";
import { RenderHelper } from "./render-helper";
import { ElementStructureAbstract } from "./element-structure-abstract";

@Injectable({ single: true })
export class RenderAbstract {
    
    protected get app() { return NimbleApp.instance; }

    public get allDirectives() { return this.app.directives; }
    public get iterationDirectives() {
        return this.allDirectives.filter(x => x.prototype.type === 'IterationDirective') as Type<IterationDirective>[];
    }
    public get normalDirectives() {
        return this.allDirectives.filter(x => x.prototype.type === 'Directive') as Type<Directive>[];
    }
    
    constructor(
        protected listenersCollector: ListenersCollector
    ) {
    }

    protected createElementFromStructure(structured: ElementStructure) {
        if (!structured.isText) {
            structured.children = structured.children.filter(x => !(x instanceof ElementIterationStructure));

            if (!structured.rawNode) {
                let element = document.createElement(structured.tagName);
                structured.rawNode = element;

                for(let attr of structured.attritubes) {
                    attr.directiveType = this.getDirectiveFromAttribute(attr.name);
                }
            }


            for(let child of structured.children) {
                this.createElementFromStructure(child);
            }
        }
        else {
            if (!structured.rawNode) {
                let node = document.createTextNode(structured.content);
                structured.rawNode = node;
            }
        }
    }

    protected compileElementFromStructure(structured: ElementStructure): Node {

        if (!structured.isText) {
            structured.compiledNode = structured.rawNode.cloneNode(structured.isPureElement) as Node;
            let element = structured.compiledNode as HTMLElement;

            // ITERATION DIRECTIVE
            if (structured.hasIterationDirectivesToApply) {
                let attr = structured.getIterationDirective();
                let iterationResponses = (attr.directiveInstance as IterationDirective).resolve(attr.name, attr.value, element, structured.scope);

                if (iterationResponses.length <= 0)
                    return null;
                
                structured.compiledBeginFn = iterationResponses[0].beginFn;
                structured.compiledEndFn = iterationResponses[0].endFn;

                iterationResponses = iterationResponses.slice(1);
                
                if (iterationResponses.length > 0) {
                    let currentIndex = structured.parent.children.findIndex(x => x === structured);

                    for(let i = 1; i <= iterationResponses.length; i++) {
                        let interation = iterationResponses[i - 1];
                        let nextIndex = currentIndex + i;
                        let iterationEstructured = this.cloneStructureDueIteration(structured, interation.beginFn, interation.endFn);
                        structured.parent.children.splice(nextIndex, 0, iterationEstructured);
                    }
                }
            }
            
            if (structured.compiledBeginFn)
                structured.compiledBeginFn();

            // ATRIBUTES
            structured.resolveAttrs();

            // INSTANTIATE DIRECTIVES
            structured.instantiateAttrDirectives();

            // CHILDREN
            for(let structChild of structured.children) {
                let node = this.compileElementFromStructure(structChild);
                if (node) {
                    structured.compiledNode.appendChild(node);
                    structChild.isRendered = true;
                }
            }

            // DIRECTIVES
            structured.resolveAttrDirectives();

            // ACTIONS 
            this.checkStructureNodeActions(structured);

            if (structured.compiledEndFn)
                structured.compiledEndFn();
        }
        else {
            structured.compiledNode = structured.rawNode.cloneNode(true) as Node;
            structured.compiledNode.textContent = RenderHelper.resolveInterpolationIfHave(structured.compiledNode.textContent, structured.scope);
        }

        if (!structured.hasParent)
            structured.isRendered = true;

        return structured.compiledNode;
    }

    public recompileElementFromStructure(structured: ElementStructure): boolean {
        if (!structured.isText) {

            if (!structured.compiledNode)
                structured.compiledNode = structured.rawNode.cloneNode(structured.isPureElement) as Node;
            let element = structured.compiledNode as HTMLElement;

            this.listenersCollector.unsubscribeAllFromElement(element);

            // ITERATION DIRECTIVE
            if (structured.hasIterationDirectivesToApply) {
                let attr = structured.getIterationDirective();
                let iterationResponses = (attr.directiveInstance as IterationDirective).resolve(attr.name, attr.value, element, structured.scope);

                if (iterationResponses.length <= 0) {
                    structured.removeCompiledNode();
                    this.listenersCollector.unsubscribeAllFromElement(element);

                    let iterationChildren = structured.getIterationStructuresFromSelf() as ElementIterationStructure[];
                    if (iterationChildren) {
                        for(let iterationChild of iterationChildren) {
                            this.listenersCollector.unsubscribeAllFromElement(iterationChild.compiledNode as HTMLElement);
                            iterationChild.removeCompiledNode();
                        }
                        structured.parent.children = structured.parent.children.filter(x => !iterationChildren.some(y => y === x));
                    }
                    
                    return;
                }
                
                let currentIterationChildren = structured.getIterationStructuresFromSelf() as ElementIterationStructure[];
                
                structured.compiledBeginFn = iterationResponses[0].beginFn;
                structured.compiledEndFn = iterationResponses[0].endFn;

                iterationResponses = iterationResponses.slice(1);

                // REMOVE LEFTOVERS
                if (currentIterationChildren.length > iterationResponses.length) {
                    let toRemove = currentIterationChildren.slice(iterationResponses.length);
                    currentIterationChildren = currentIterationChildren.slice(0, iterationResponses.length);
                    for(let iterationChild of toRemove) {
                        this.listenersCollector.unsubscribeAllFromElement(iterationChild.compiledNode as HTMLElement);
                        iterationChild.removeCompiledNode();
                    }
                    structured.parent.children = structured.parent.children.filter(x => !toRemove.some(y => y === x));
                }
                // ADD THE NEW ONES
                else if (currentIterationChildren.length < iterationResponses.length) {
                    let childrenDiff = iterationResponses.length - currentIterationChildren.length;
                    let currentIndex = currentIterationChildren.length > 0
                        ? structured.parent.children.findIndex(x => x === currentIterationChildren[currentIterationChildren.length - 1])
                        : structured.parent.children.findIndex(x => x === structured);

                    for(let i = 1; i <= childrenDiff; i++) {
                        let interation = iterationResponses[currentIterationChildren.length + i - 1];
                        let nextIndex = currentIndex + i;
                        let iterationEstructured = this.cloneStructureDueIteration(structured, interation.beginFn, interation.endFn);
                        structured.parent.children.splice(nextIndex, 0, iterationEstructured);
                        iterationEstructured.isRendered = false;
                    }
                }

                for (let i = 0; i < currentIterationChildren.length; i++) {
                    let interationResponse = iterationResponses[i];
                    let iterationChild = currentIterationChildren[i];
                    iterationChild.compiledBeginFn = interationResponse.beginFn;
                    iterationChild.compiledEndFn = interationResponse.endFn;
                }
            }
            
            if (structured.compiledBeginFn)
                structured.compiledBeginFn();

            // ATRIBUTES
            structured.resolveAttrs();

            // INSTANTIATE DIRECTIVES
            structured.instantiateAttrDirectives();

            // RENDER
            structured.renderNodeIfNot();

            // CHILDREN
            for(let i = 0; i < structured.children.length; i++) {
                let structChild = structured.children[i];
                this.recompileElementFromStructure(structChild);
            }

            // DIRECTIVES
            structured.resolveAttrDirectives();

            // ACTIONS 
            this.checkStructureNodeActions(structured);

            if (structured.compiledEndFn)
                structured.compiledEndFn();
        }
        else {
            if (!structured.compiledNode)
                structured.compiledNode = structured.rawNode.cloneNode(true) as Node;

            let textContent = RenderHelper.resolveInterpolationIfHave(structured.rawNode.textContent, structured.scope);
            
            if (textContent !== structured.compiledNode.textContent)
                structured.compiledNode.textContent = textContent;

            // RENDER
            structured.renderNodeIfNot();
        }
    }

    private checkStructureNodeActions(structure: ElementStructureAbstract) {
        let element = structure.compiledNode as HTMLElement;
        if (structure.compiledBeginFn) {
            this.listenersCollector.addActionsInElementsListeners(element, structure.compiledBeginFn, structure.compiledEndFn);
        }
        else {
            let parent = structure.parent;
            let beginFn = null;
            let endFn = null;
            while(parent && !beginFn && !endFn) {
                if (parent && parent.compiledBeginFn && parent.compiledEndFn) {
                    beginFn = parent.compiledBeginFn;
                    endFn = parent.compiledEndFn;
                    break;
                }
                parent = parent.parent;
            }
            this.listenersCollector.addActionsInElementsListeners(element, beginFn, endFn);
        }
    }

    private cloneStructureDueIteration(structure: ElementStructure, beginFn: () => void, endFn: () => void): ElementIterationStructure {
        let iterationStructure = new ElementIterationStructure(structure);
        iterationStructure.compiledBeginFn = beginFn;
        iterationStructure.compiledEndFn = endFn;

        return iterationStructure;
    }

    private getDirectiveFromAttribute(attrName: string): Type<Directive> {
        let directive: Type<Directive> = null
        for(let directiveType of this.allDirectives) {
            let selectors = directiveType.prototype.selectors as string[];
            attrName = attrName.toLowerCase();
            let selector = selectors.find(selector => {
                if (selector) {
                    selector = selector.toLowerCase();
                    if (/^\[([^)]+)\]$/g.test(attrName) && /^(?!\(\/).*(?!\))$/g.test(selector))
                        return attrName === `[${selector.replace(/\[|\]/g, '')}]`;
                    else
                        return attrName === selector;
                }
                return false;
            });

            if (selector) {
                directive = directiveType;
                break;
            }
        }

        if (!/^\(([^)]+)\)$/g.test(attrName)) {
            if (!/^\[([^)]+)\]$/g.test(attrName) && DirectiveHelper.checkSelectorMustHavePureValue(attrName)) {
                return null;
            }
        }

        return directive;
    }
}

export class IterateDirectiveResponse {
    beginFn?: () => void;
    endFn?: () => void;

    constructor(obj: Partial<IterateDirectiveResponse> = null) {
        if (obj) {
            Object.assign(this, obj);
        }
    }
}