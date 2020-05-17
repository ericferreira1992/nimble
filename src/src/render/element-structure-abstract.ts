import { isNullOrUndefined } from "util";
import { RenderHelper } from "./render-helper";
import { IScope } from "../page/interfaces/scope.interface";
import { Directive } from "../directives/abstracts/directive";
import { IterationDirective } from "../directives/abstracts/iteration-directive";
import { BaseFormFieldDirective } from "../directives/abstracts/base-form-field-directive";
import { FormDirective } from "../directives/forms/form.directive";
import { DirectiveHelper } from "../directives/directive.helper";
import { Type } from "../inject/type.interface";
import { NimbleApp } from "../app";

export abstract class ElementStructureAbstract {
    public parent: ElementStructureAbstract = null;
    public scope: IScope;
    public tagName: string = '';
    public content: string = '';
    public attritubes: AttributeStructure<Directive>[] = [];
    public children: ElementStructureAbstract[] = [];
    public directivesInstance: Directive[] = [];
    public rawNode: Node = null;
    public compiledNode: Node = null;
    public compiledBeginFn: () => void = null;
    public compiledEndFn?: () => void = null;
    
    public isVoid: boolean = false;
    public isPureElement: boolean = false;

    // ITERATION CONTROL
    public isRendered: boolean = false;

    public get hasParent(): boolean { return !isNullOrUndefined(this.parent); }
    public get hasChildren(): boolean { return this.children.length > 0; }
    public get hasAttritubes(): boolean { return this.attritubes.length > 0; }
    public get isText(): boolean { return this.tagName ? false : true; }
    public get hasNormalDirectivesToApply(): boolean { return this.attritubes.some(x => x.isNormalDirective); }
    public get hasIterationDirectivesToApply(): boolean { return this.attritubes.some(x => x.isIterationDirective); }
    public get nodeIsRenderedInDOM(): boolean { return this.compiledNode && !isNullOrUndefined(this.compiledNode.parentNode); }

    constructor(scope: IScope) {
        this.scope = scope;
    }

    public removeCompiledNode() {
        if (this.nodeIsRenderedInDOM)
            this.compiledNode.parentNode.removeChild(this.compiledNode);
        this.isRendered = false;
    }

    public getIterationDirective(): AttributeStructure<IterationDirective> {
        let attr = this.attritubes.find(x => x.directiveType != null && x.directiveType.prototype.type === 'IterationDirective');

        if (attr) {
            let instance = this.directivesInstance.find(x => x instanceof attr.directiveType);
            if (!instance) {
                let instance = NimbleApp.inject<Directive>(attr.directiveType);
                instance.element = this.compiledNode as HTMLElement;
                this.directivesInstance.push(instance);
            }
            else {
                instance.element = this.compiledNode as HTMLElement;
                instance.onDestroy(attr.name, this.scope);
            }

            if (instance) {
                instance.all = this.directivesInstance.filter(x => x !== instance);
            }
        }

        return attr;
    }

    public getNormalDirectives(): AttributeStructure<Directive>[] {
        return this.attritubes.filter(x => x.directiveType != null && x.directiveType.prototype.type !== 'IterationDirective');
    }

    public getAttributes(): AttributeStructure<Directive>[] {
        return this.attritubes.filter(x => x.directiveType == null);
    }
    
    public resolveAttrs() {
        for (let attr of this.getAttributes()) {
            RenderHelper.resolveDefaultAttribute(this.compiledNode as HTMLElement, attr.name, attr.value, this.scope);
        }
    }
    
    public resolveAttrDirectives() {
        let attrs = this.getNormalDirectives();
        attrs = attrs.sort((a,b) => {
            if (DirectiveHelper.isNativeSelector(a.name))
                return -1;
            else if (DirectiveHelper.isNativeSelector(b.name))
                return 1;

            return 0;
        });
        for (let attr of attrs) {
            attr.resolveDirective();
        }
    }

    public getIterationStructuresFromSelf() {
        return this.parent.children.filter(x => (x as any).from === this);
    }

    public instantiateAttrDirectives() {
        let attrs = this.getNormalDirectives();
        for (let attr of attrs) {
            let instance = this.directivesInstance.find(x => x instanceof attr.directiveType);
            if (!instance) {
                instance = NimbleApp.inject<Directive>(attr.directiveType);
                instance.element = this.compiledNode as HTMLElement;
                this.directivesInstance.push(instance);
            }
            else {
                instance.element = this.compiledNode as HTMLElement;
                instance.onDestroy(attr.name, this.scope);
            }

            instance.setValueOfSelector(attr.name, attr.getCompiledValue());
        }

        for (let attr of attrs) {
            if (attr.directiveInstance) {
                attr.directiveInstance.all = this.directivesInstance.filter(x => {
                    return x !== attr.directiveInstance && !(x instanceof IterationDirective);
                });
            }
        }
    }

    public renderNodeIfNot() {
        this.checkRenderedCorrectly();
        if (!this.isRendered && this.parent && this.parent.compiledNode) {
            let structureIndex = this.parent.children.findIndex(x => x === this);

            let getNextNodeAbove = () => {
                for(let i = structureIndex - 1; i >= 0; i--) {
                    let node = this.parent.children[i];
                    if (node.compiledNode && node.compiledNode.parentNode === this.parent.compiledNode && node.nodeIsRenderedInDOM) {
                        return (node.compiledNode as HTMLElement).nextSibling;
                    }
                }
                return null; 
            };
            let getNextNodeBelow = () => {
                for(let i = structureIndex + 1; i < this.parent.children.length; i++) {
                    let node = this.parent.children[i];
                    if (node.compiledNode && node.compiledNode.parentNode === this.parent.compiledNode && node.nodeIsRenderedInDOM) {
                        return node.compiledNode as HTMLElement;
                    }
                }
                return null; 
            };

            let nodeAbove = getNextNodeAbove();
            if (nodeAbove) {
                this.parent.compiledNode.insertBefore(this.compiledNode, nodeAbove);
            }
            else {
                let nodeBelow = getNextNodeBelow();
                if (nodeBelow) {
                    this.parent.compiledNode.insertBefore(this.compiledNode, nodeBelow);
                }
                else {
                    this.parent.compiledNode.appendChild(this.compiledNode);
                }
            }
        }
    }

    private checkRenderedCorrectly() {
        if (this.nodeIsRenderedInDOM) {
            if (this.parent && this.compiledNode.parentNode !== this.parent.compiledNode) {
                this.compiledNode.parentNode.removeChild(this.compiledNode);
            }
        }
    }
}

export class AttributeStructure<T extends Directive> {
    public structure: ElementStructureAbstract = null;
    public name: string = '';
    public value: string = '';
    public directiveType: Type<T> = null;

    public get directiveInstance() {
        return this.structure.directivesInstance.find(x => this.directiveType != null && x instanceof this.directiveType);
        // try {
        // }
        // catch{
        //     return null;
        // }
    }
    public get isIterationDirective() { return this.directiveType != null && this.directiveType.prototype.type === 'IterationDirective'; }
    public get isNormalDirective() { return this.directiveType != null && this.directiveType.prototype.type !== 'IterationDirective'; }

    constructor(name: string, value: string, strucutre: ElementStructureAbstract, directiveType: Type<T> = null) {
        this.name = name;
        this.value = value;
        this.structure = strucutre;
        this.directiveType = directiveType;
    }

    public getCompiledValue() {
        let value = this.value;
        
        if (!/^\(([^)]+)\)$/g.test(this.name)) {
            if (/^\[([^)]+)\]$/g.test(this.name)) {
                if (!DirectiveHelper.checkSelectorMustHavePureValue(this.name))
                value = this.structure.scope.eval(value);
            }
            else {
                value = RenderHelper.resolveInterpolationIfHave(value, this.structure.scope);
                if (DirectiveHelper.checkSelectorMustHavePureValue(this.name)) {
                    value = value;
                }
            }
        }

        return value;
    }

    public resolveDirective(){
        this.checkDirectiveBeforeResolve();
        this.directiveInstance.resolve(this.name, this.getCompiledValue(), this.structure.compiledNode as HTMLElement, this.structure.scope);
    }

    private checkDirectiveBeforeResolve() {
        if (this.directiveInstance instanceof BaseFormFieldDirective) {
            let structure = this.structure.parent;
            let formDirective: FormDirective = null;
            while(!formDirective && structure) {
                let attr = structure.attritubes.find(x => x.directiveInstance instanceof FormDirective);
                if (attr) {
                    formDirective = attr.directiveInstance as FormDirective;
                }
                structure = structure.parent;
            }
            this.directiveInstance.form = formDirective && formDirective.form;
        }
    }
}