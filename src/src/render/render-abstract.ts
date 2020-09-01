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
            structured.children = structured.children.filter(x => !(x instanceof ElementIterationStructure));

            if (!structured.rawNode) {
                let element = document.createElement(structured.tagName);
                structured.rawNode = element;
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
			structured.attrDirectives.default.forEach(x => {
				x.directive.isResolved = false;
				x.props.in.forEach(y => y.isResolved = false);
				x.props.out.forEach(y => y.isResolved = false);
			});

            let element = structured.compiledNode as HTMLElement;

            // ITERATION DIRECTIVE
            if (structured.hasIterationDirectivesToApply) {
				let attr = structured.getIterationDirective();
				let directiveInstance = attr.directiveInstance as IterationDirective;
				let iterationResponses = directiveInstance.onIterate();

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
            structured.resolveAttrDirectivesIfNeeded();

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

			// ITERATION DIRECTIVE
			if (structured.hasIterationDirectivesToApply) {
				let attr = structured.getIterationDirective();
				let directiveInstance = attr.directiveInstance as IterationDirective;

				let iterationResponses = directiveInstance.onIterate();

				if (iterationResponses.length <= 0) {
					structured.removeCompiledNode();

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
				else {
					directiveInstance.onRender();

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

			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				let teste = '';
			}

			// ATRIBUTES
			let timeBegin = performance.now();
			structured.resolveAttrs();
			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				console.log(`ATTRIBU ${(performance.now() - timeBegin)} ms`);
			}

			// INSTANTIATE DIRECTIVES
			timeBegin = performance.now();
			structured.instantiateAttrDirectives();
			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				console.log(`INSTANCE ${(performance.now() - timeBegin)} ms`);
			}

			// RENDER
			timeBegin = performance.now();
			structured.renderNodeIfNot();
			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				console.log(`RENDER ${(performance.now() - timeBegin)} ms`);
			}

			// CHILDREN
			for(let i = 0; i < structured.children.length; i++) {
				let structChild = structured.children[i];
				this.recompileElementFromStructure(structChild);
			}

			// DIRECTIVES
			timeBegin = performance.now();
			structured.resolveAttrDirectivesIfNeeded();
			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				console.log(`RESOLVE ${(performance.now() - timeBegin)} ms`);
			}

			// ACTIONS 
			timeBegin = performance.now();
			this.checkStructureNodeActions(structured);
			if (structured.tagName === 'tr' && structured.hasIterationDirectivesToApply) {
				console.log(`ACTIONS ${(performance.now() - timeBegin)} ms`);
			}

			if (structured.compiledEndFn)
				structured.compiledEndFn();
        }
        else {
            if (!structured.compiledNode)
                structured.compiledNode = structured.rawNode.cloneNode(true) as Node;

            if (structured.rawNode.textContent) {
				let textContent = RenderHelper.resolveInterpolationIfHave(structured.rawNode.textContent, structured.scope);
				if (textContent !== structured.compiledNode.textContent)
					structured.compiledNode.textContent = textContent;
			}

            // RENDER
            structured.renderNodeIfNot();
        }
    }

    private checkStructureNodeActions(structure: ElementStructureAbstract) {
		let element = structure.compiledNode as HTMLElement;

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
        let iterationStructure = new ElementIterationStructure(structure);
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