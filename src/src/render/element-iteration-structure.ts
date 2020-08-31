import { ElementStructureAbstract, AttributeStructure } from "./element-structure-abstract";
import { ElementStructure } from "./element-structure";

export class ElementIterationStructure extends ElementStructureAbstract {
    from: ElementStructureAbstract = null
    
    constructor(from: ElementStructureAbstract) {
        super(from.scope);
        this.from = from;
        this.parent = from.parent;
        this.tagName = from.tagName;
        this.content = from.content;
        this.directivesInstance = [];
        this.rawNode = from.rawNode.cloneNode(from.isPureElement);
        this.isVoid = from.isVoid;
        this.isPureElement = from.isPureElement;
        this.isRendered = false;
        this.compiledNode = null;
        this.attrs = from.attrs.map(x => new AttributeStructure(
            x.name, x.value, this, x.directiveType, true
        ));
        this.attrDirectives = {
			default: from.attrDirectives.default.map(x => ({
				directive: new AttributeStructure(x.directive.name, x.directive.value, this, x.directive.directiveType, true),
				props: {
					in: x.props.in.map(y => new AttributeStructure(y.name, y.value, this, y.directiveType, true)),
					out: x.props.out.map(y => new AttributeStructure(y.name, y.value, this, y.directiveType, true)),
				}
			})),
			iterate: { directive: null, props: { in: [], out: [] } },
		};
        this.compiledBeginFn = null;
        this.compiledEndFn = null;

        this.children = this.cloneChildrensRecursive(this.from.children, this);
    }

    private cloneChildrensRecursive(children: ElementStructureAbstract[], parent: ElementStructureAbstract) {
        return children.map(x => {
            let child = new ElementStructure(this.scope);
            child.parent = parent;
            child.tagName = x.tagName;
            child.content = x.content;
            child.directivesInstance = [];
            child.rawNode = x.rawNode.cloneNode(x.isPureElement);
            child.isVoid = x.isVoid;
			child.isPureElement = x.isPureElement;
			
			child.attrs = x.attrs.map(a => new AttributeStructure(
				a.name, a.value, child, a.directiveType, true
			));
			child.attrDirectives = {
				default: x.attrDirectives.default.map(a => ({
					directive: new AttributeStructure(a.directive.name, a.directive.value, child, a.directive.directiveType, true),
					props: {
						in: a.props.in.map(y => new AttributeStructure(y.name, y.value, child, y.directiveType, true)),
						out: a.props.out.map(y => new AttributeStructure(y.name, y.value, child, y.directiveType, true)),
					}
				})),
				iterate: {
					directive: x.attrDirectives.iterate.directive
						? new AttributeStructure(x.attrDirectives.iterate.directive.name, x.attrDirectives.iterate.directive.value, child, x.attrDirectives.iterate.directive.directiveType, true)
						: null,
					props: {
						in: x.attrDirectives.iterate.props.in.map(y => new AttributeStructure(y.name, y.value, child, y.directiveType, true)),
						out: x.attrDirectives.iterate.props.out.map(y => new AttributeStructure(y.name, y.value, child, y.directiveType, true)),
					}
				},
			};
			
            child.children = (x.children.length > 0) ? this.cloneChildrensRecursive(x.children, child) : [];
            return child;
        });
    }

}