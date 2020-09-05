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
    public children: ElementStructureAbstract[] = [];
    public directivesInstance: Directive[] = [];
    public rawNode: Node = null;
    public compiledNode: Node = null;
    public compiledBeginFn: () => void = null;
	public compiledEndFn?: () => void = null;
    public attrs: AttributeStructure<Directive>[] = [];
	public attrDirectives: {
		default: {
			directive: AttributeStructure<Directive>,
			props: { 
				in: AttributeStructure<Directive>[],
				out: AttributeStructure<Directive>[],
			}
		}[],
		iterate: {
			directive: AttributeStructure<Directive>,
			props: { 
				in: AttributeStructure<Directive>[],
				out: AttributeStructure<Directive>[],
			}
		}
	} = { default: [], iterate: { directive: null, props: { in: [], out: [] } } };
    
    public isVoid: boolean = false;
    public isPureElement: boolean = false;
    public isRendered: boolean = false;
    public hasInterpolationInText: boolean = false;

    public get hasParent(): boolean { return !isNullOrUndefined(this.parent); }
    public get hasChildren(): boolean { return this.children.length > 0; }
    public get hasAttritubes(): boolean { return this.attrs.length > 0; }
    public get isText(): boolean { return this.tagName ? false : true; }
    public get hasNormalDirectivesToApply(): boolean { return this.attrDirectives.default.length > 0; }
    public get hasIterationDirectivesToApply(): boolean { return !!this.attrDirectives.iterate.directive; }
    public get nodeIsRenderedInDOM(): boolean { return this.compiledNode && !isNullOrUndefined(this.compiledNode.parentNode); }

    constructor(scope: IScope) {
        this.scope = scope;
    }

    public removeCompiledNode(onRemoveNode?: (structure: ElementStructureAbstract) => void) {
        if (this.hasChildren) {
            for(const child of this.children) {
                child.removeCompiledNode(onRemoveNode);
            }
        }

        if (this.nodeIsRenderedInDOM) {
            this.compiledNode.parentNode.removeChild(this.compiledNode);
            this.isRendered = false;
		}
		this.destroyAllDirectives();
		if (onRemoveNode) onRemoveNode(this);
	}
	
	public destroyAllDirectives() {
		for(const attr of this.attrDirectives.default) {
			attr.directive.destroyDirective();
		}

		if (this.attrDirectives.iterate.directive) {
			this.attrDirectives.iterate.directive.destroyDirective();
		}
	}

    public getIterationDirective(): AttributeStructure<IterationDirective> {
		const attr = this.attrDirectives.iterate.directive;
		const props = this.attrDirectives.iterate.props;

        if (attr) {
            let instance = this.directivesInstance.find(x => x.selector === attr.name);
            if (!instance) {
                instance = NimbleApp.inject<Directive>(attr.directiveType);
                instance.scope = this.scope;
				instance.element = this.compiledNode as HTMLElement;
				instance.selectorActive = attr.name;

				instance.insertInput(instance.selector, () => attr.value);

				props.in.forEach((attr) => {
					instance.insertInput(
						attr.name,
						() => AttributeStructure.getCompiledValue(attr.name, attr.value, this.scope)
					);
				});
				props.out.forEach((attr) => {
					instance.insertOutput(
						attr.name.replace(/\(|\)/g, ''),
						() => attr.value
					);
				});
				
				attr.directiveInstance = instance;
				this.directivesInstance.push(instance);
            }
            else {
                instance.element = this.compiledNode as HTMLElement;
            }
			instance.all = () => this.directivesInstance;
        }

        return attr as AttributeStructure<IterationDirective>;
    }
    
    public resolveAttrs() {
        for (const attr of this.attrs.filter(x => x.hasInterpolationInText || !x.isResolved)) {
			RenderHelper.resolveDefaultAttribute(this.compiledNode as HTMLElement, attr.name, attr.value, this.scope);
			attr.isResolved = true;
        }
    }
    
    public resolveAttrDirectivesIfNeeded() {
        for (const attr of this.attrDirectives.default) {
            attr.directive.resolveDirectiveIfNeeded();
        }
    }

    public getIterationStructuresFromSelf() {
        return this.parent.children.filter(x => (x as any).from === this);
    }

    public instantiateAttrDirectives() {
		const attrsDefaults = this.attrDirectives.default.filter(x => !x.directive.isResolved);
        for (const attrDefault of attrsDefaults) {
			const attr = attrDefault.directive;
			const props = attrDefault.props;
            let instance = this.directivesInstance.find(x => x.selector === attr.name.replace(/\[|\]/g, ''));
            if (!instance) {
				instance = NimbleApp.inject<Directive>(attr.directiveType);
                instance.element = this.compiledNode as HTMLElement;
				instance.scope = this.scope;
				instance.selectorActive = attr.name;
				
				const inputs = props.in.map(x => ({
					name: x.name,
					value: () => AttributeStructure.getCompiledValue(attr.name, attr.value, this.scope),
				}));
				const outputs = props.out.map(x => ({
					name: x.name.replace(/\(|\)/g, ''),
					value: () => x.value,
				}));

				if (instance.selectorIsInput) {
					inputs.push({
						name: instance.selector,
						value: () => AttributeStructure.getCompiledValue(attr.name, attr.value, this.scope)
					});
				}
				else {
					outputs.push({ name: instance.selector, value: () => attr.value });
				}

				inputs.forEach((x) => instance.insertInput(x.name, x.value));
				outputs.forEach((x) => instance.insertOutput(x.name, x.value));
			
				if (attr.directiveInstance) {
					attr.directiveInstance.all = () => this.directivesInstance;
				}
				
				attr.directiveInstance = instance;
                this.directivesInstance.push(instance);
            }
        }
    }

    public renderNodeIfNot() {
        this.checkRenderedCorrectly();

        if (!this.isRendered && this.parent && this.parent.compiledNode) {
            const structureIndex = this.parent.children.findIndex(x => x === this);

            const getNextNodeAbove = () => {
                for(let i = structureIndex - 1; i >= 0; i--) {
                    const node = this.parent.children[i];
                    if (node.compiledNode && node.compiledNode.parentNode === this.parent.compiledNode && node.nodeIsRenderedInDOM) {
                        return (node.compiledNode as HTMLElement).nextSibling;
                    }
                }
                return null; 
            };
            const getNextNodeBelow = () => {
                for(let i = structureIndex + 1; i < this.parent.children.length; i++) {
                    const node = this.parent.children[i];
                    if (node.compiledNode && node.compiledNode.parentNode === this.parent.compiledNode && node.nodeIsRenderedInDOM) {
                        return node.compiledNode as HTMLElement;
                    }
                }
                return null; 
            };

            const nodeAbove = getNextNodeAbove();
            if (nodeAbove) {
                this.parent.compiledNode.insertBefore(this.compiledNode, nodeAbove);
                this.isRendered = true;
            }
            else {
                const nodeBelow = getNextNodeBelow();
                if (nodeBelow) {
                    this.parent.compiledNode.insertBefore(this.compiledNode, nodeBelow);
                    this.isRendered = true;
                }
                else {
                    this.parent.compiledNode.appendChild(this.compiledNode);
                    this.isRendered = true;
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
    public get allDirectives() { return NimbleApp.instance.directives; }
	
	public isResolved: boolean = false;
	public hasInterpolationInText: boolean = false;
    public structure: ElementStructureAbstract = null;
    public name: string = '';
    public value: string = '';
    public directiveType: Type<T> = null;
    public directiveInstance: Directive = null;

    public get isIterationDirective() { return this.directiveType != null && this.directiveType.prototype.type === 'IterationDirective'; }
    public get isDefaultDirective() { return this.directiveType != null && this.directiveType.prototype.type !== 'IterationDirective'; }
    public get isNotDirective() { return !this.directiveType; }

    constructor(name: string, value: string, strucutre: ElementStructureAbstract, directiveType: Type<T> = null, fromClone: boolean = false) {
        this.name = name;
        this.value = value;
        this.structure = strucutre;
        this.directiveType = directiveType ?? (!fromClone ? this.getDirective() : null);
    }

    public resolveDirectiveIfNeeded(){
		if (!this.isResolved) {
			this.isResolved = true;
			this.checkDirectiveBeforeResolve();
			this.directiveInstance.onRender();
		}
		else {
			this.checkDirectiveBeforeResolve();
			this.directiveInstance.onChange();
		}
	}
	
	public destroyDirective() {
		if (this.directiveInstance) {
			this.directiveInstance.onDestroy();
		}
		this.isResolved = false;
	}

    private checkDirectiveBeforeResolve() {
        if (this.directiveInstance instanceof BaseFormFieldDirective) {
            let structure = this.structure.parent;
            let formDirective: FormDirective = null;
            while(!formDirective && structure) {
                formDirective = structure.directivesInstance.find(x => x instanceof FormDirective) as FormDirective;
                structure = structure.parent;
            }
            this.directiveInstance.form = formDirective && formDirective.form;
        }
	}
	
	private getDirective(): Type<T> {
        let directive: Type<T> = null
		const attrName = this.name.toLowerCase();
        for(let directiveType of this.allDirectives) {
            const selectors = directiveType.prototype.selectors as string[];
            const selector = selectors.find(selector => {
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
				directive = directiveType as Type<T>;
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

    public static getCompiledValue(propName: string, propValue: string, scope: IScope) {        
        if (!/^\(([^)]+)\)$/g.test(propName)) {
            if (/^\[([^)]+)\]$/g.test(propName)) {
                if (!DirectiveHelper.checkSelectorMustHavePureValue(propName)) {
					propValue = scope.compile(propValue);
				}
            }
            else {
                propValue = RenderHelper.resolveInterpolationIfHave(propValue, scope);
            }
        }

        return propValue;
    }
}