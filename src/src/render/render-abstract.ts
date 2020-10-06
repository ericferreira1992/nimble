import { ElementStructure } from "./element-structure";
import { NimbleApp } from "../app";
import { IterationDirective } from "../directives/abstracts/iteration-directive";
import { Injectable } from "../inject/injectable";
import { ElementIterationStructure } from "./element-iteration-structure";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { RenderHelper } from "./render-helper";
import { ElementStructureAbstract } from "./element-structure-abstract";

@Injectable({ single: true })
export class RenderAbstract {
    
    protected get app() { return NimbleApp.instance; }
    
    constructor(
        protected listenersCollector: ElementListenersCollector
    ) {
    }

    protected createElementFromStructure(structured: ElementStructure) {
        if (!structured.isText) {
            if (!structured.rawNode) {
                structured.rawNode = document.createElement(structured.tagName);
            }

            for(const child of structured.children) {
                this.createElementFromStructure(child);
            }
        }
        else {
            if (!structured.rawNode) {
                const node = document.createTextNode(structured.content);
                structured.rawNode = node;
            }
        }
    }

    protected compileElementFromStructure(structured: ElementStructure): Node {
        if (!structured.isText) {
			if (!structured.compiledNode)
				structured.compiledNode = structured.rawNode.cloneNode(structured.isPureElement) as Node;

			structured.attrDirectives.default.forEach(x => {
				x.directive.isResolved = false;
				x.props.in.forEach(y => y.isResolved = false);
				x.props.out.forEach(y => y.isResolved = false);
			});

			let iterationResponses: IterateDirectiveResponse[] = [];

            // ITERATION DIRECTIVE
            if (structured.hasIterationDirectivesToApply) {

				structured.attrDirectives.iterate.directive.isResolved = false;
				structured.attrDirectives.iterate.props.in.forEach(y => y.isResolved = false);
				structured.attrDirectives.iterate.props.out.forEach(y => y.isResolved = false);

				const attr = structured.getIterationDirective();
				const directiveInstance = attr.directiveInstance as IterationDirective;

				iterationResponses = directiveInstance.onIterate();

                if (iterationResponses.length <= 0) {
					structured.removeCompiledNode();
					return null;
				}
				
                structured.compiledBeginFn = iterationResponses[0].beginFn;
                structured.compiledEndFn = iterationResponses[0].endFn;

                iterationResponses = iterationResponses.slice(1);
            }
			
			if (structured.compiledBeginFn)
				structured.compiledBeginFn();

			// ATRIBUTES
			structured.resolveAttrs();

			// INSTANTIATE DIRECTIVES
			structured.instantiateAttrDirectives();

            // CHILDREN
			structured.children = structured.children.filter(child => {
				if ((child instanceof ElementIterationStructure)) {
					child.removeCompiledNode();
					return false;
				}
				return true
			});
            for(const structChild of structured.children) {
                const node = this.compileElementFromStructure(structChild);
                if (node && !structured.isRendered) {
                    structured.compiledNode.appendChild(node);
                    structChild.isRendered = true;
                }
            }

			// DIRECTIVES
			structured.resolveAttrDirectivesIfNeeded();

			// ACTIONS 
			this.checkStructureNodeActions(structured);

			if (structured.compiledEndFn)
				structured.compiledEndFn();
				
			if (iterationResponses.length > 0) {
				const currentIndex = structured.parent.children.findIndex(x => x === structured);

				for(let i = 1; i <= iterationResponses.length; i++) {
					const interation = iterationResponses[i - 1];
					const nextIndex = currentIndex + i;
					structured.parent.children.splice(nextIndex, 0, this.cloneStructureDueIteration(structured, interation.beginFn, interation.endFn));
				}
			}
        }
        else {
			if (!structured.compiledNode)
				structured.compiledNode = structured.rawNode.cloneNode(true) as Node;
			
			if (structured.hasInterpolationInText) {
				const content = RenderHelper.resolveInterpolationIfHave(structured.compiledNode.textContent, structured.scope);
				structured.compiledNode.textContent = content;
			}
        }

        if (!structured.hasParent)
            structured.isRendered = true;

        return structured.compiledNode;
    }

    public recompileElementFromStructure(structured: ElementStructure): void {
		let time = performance.now();
        if (!structured.isText) {
			if (!structured.compiledNode)
				structured.compiledNode = structured.rawNode.cloneNode(structured.isPureElement) as Node;

			let iterationResponses: IterateDirectiveResponse[] = [];

			// ITERATION DIRECTIVE
			if (structured.hasIterationDirectivesToApply) {
				const attr = structured.getIterationDirective();
				const directiveInstance = attr.directiveInstance as IterationDirective;

				iterationResponses = directiveInstance.onIterate();

				if (iterationResponses.length <= 0) {
					structured.removeCompiledNode((structure) => {
						this.listenersCollector.unsubscribeAllFromElement(structure.compiledNode as HTMLElement);
					});

					const iterationChildren = structured.getIterationStructuresFromSelf() as ElementIterationStructure[];
					if (iterationChildren) {
						for(const iterationChild of iterationChildren) {
							iterationChild.removeCompiledNode((structure) => {
								this.listenersCollector.unsubscribeAllFromElement(structure.compiledNode as HTMLElement);
							});
						}
						structured.parent.children = structured.parent.children.filter(x => !iterationChildren.some(y => y === x));
					}
					return;
				}
				else {
					directiveInstance.onRender();

					let currentIterationChildren = structured.getIterationStructuresFromSelf() as ElementIterationStructure[];
				
					structured.compiledBeginFn = iterationResponses[0].beginFn;
					structured.compiledEndFn = iterationResponses[0].endFn;

					iterationResponses = iterationResponses.slice(1);

					// REMOVE LEFTOVERS
					if (currentIterationChildren.length > iterationResponses.length) {
						const toRemove = currentIterationChildren.slice(iterationResponses.length);
						currentIterationChildren = currentIterationChildren.slice(0, iterationResponses.length);
						for(const iterationChild of toRemove) {
							this.listenersCollector.unsubscribeAllFromElement(iterationChild.compiledNode as HTMLElement);
							iterationChild.removeCompiledNode((structure) => {
								this.listenersCollector.unsubscribeAllFromElement(structure.compiledNode as HTMLElement);
							});
						}
						structured.parent.children = structured.parent.children.filter(x => toRemove.indexOf(x as ElementIterationStructure) < 0);
					}
					// ADD THE NEW ONES
					else if (currentIterationChildren.length < iterationResponses.length) {
						const childrenDiff = iterationResponses.length - currentIterationChildren.length;
						const currentIndex = currentIterationChildren.length > 0
							? structured.parent.children.findIndex(x => x === currentIterationChildren[currentIterationChildren.length - 1])
							: structured.parent.children.findIndex(x => x === structured);

						for(let i = 1; i <= childrenDiff; i++) {
							const interation = iterationResponses[currentIterationChildren.length + i - 1];
							const nextIndex = currentIndex + i;
							structured.parent.children.splice(nextIndex, 0, this.cloneStructureDueIteration(structured, interation.beginFn, interation.endFn));
						}
					}

					for (let i = 0; i < currentIterationChildren.length; i++) {	
						let interationResponse = iterationResponses[i];	
						let iterationChild = currentIterationChildren[i];	
						iterationChild.compiledBeginFn = interationResponse.beginFn;	
						iterationChild.compiledEndFn = interationResponse.endFn;	
					}
				}
			}
			
			if (structured.compiledBeginFn)
				structured.compiledBeginFn();

			// ATRIBUTES
			// time = performance.now();
			structured.resolveAttrs();
			// if (structured.tagName === 'tr') console.log(`ATTR ${performance.now() - time}\n`);

			// INSTANTIATE DIRECTIVES
			// time = performance.now();
			structured.instantiateAttrDirectives();
			// if (structured.tagName === 'tr') console.log(`INSTANC ${performance.now() - time}\n`);

			// RENDER
			// time = performance.now();
			structured.renderNodeIfNot();
			// if (structured.tagName === 'tr') console.log(`RENDER ${performance.now() - time}\n`);

			// CHILDREN
			// time = performance.now();
			for(let i = 0; i < structured.children.length; i++) {
				let structChild = structured.children[i];
				this.recompileElementFromStructure(structChild);
			}
			// if (structured.tagName === 'tr') console.log(`CHILDRENS ${performance.now() - time}\n`);

			// DIRECTIVES
			// time = performance.now();
			structured.resolveAttrDirectivesIfNeeded();
			// if (structured.tagName === 'tr') console.log(`RESOLVES ${performance.now() - time}\n`);
			// if (structured.tagName === 'tr') console.log('');

			// ACTIONS 
			this.checkStructureNodeActions(structured);

			if (structured.compiledEndFn)
				structured.compiledEndFn();
        }
        else {
            if (!structured.compiledNode)
                structured.compiledNode = structured.rawNode.cloneNode(true) as Node;

            if (structured.hasInterpolationInText && structured.rawNode.textContent) {
				const textContent = RenderHelper.resolveInterpolationIfHave(structured.rawNode.textContent, structured.scope);
				if (textContent !== structured.compiledNode.textContent)
					structured.compiledNode.textContent = textContent;
			}

            // RENDER
            structured.renderNodeIfNot();
		}
    }

    private checkStructureNodeActions(structure: ElementStructureAbstract) {
		const element = structure.compiledNode as HTMLElement;

        if (structure.compiledBeginFn) {
            this.listenersCollector.addActionsInElementsListeners(element, structure.compiledBeginFn, structure.compiledEndFn);
		}
		let parent = structure.parent;
		while(parent) {
			if (parent && parent.compiledBeginFn && parent.compiledEndFn) {
				this.listenersCollector.addActionsInElementsListeners(element, parent.compiledBeginFn, parent.compiledEndFn);
			}
			parent = parent.parent;
		}
    }

    private cloneStructureDueIteration(structure: ElementStructure, beginFn: () => void, endFn: () => void): ElementIterationStructure {
        const iterationStructure = new ElementIterationStructure(structure);
        iterationStructure.compiledBeginFn = beginFn;
        iterationStructure.compiledEndFn = endFn;

        return iterationStructure;
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