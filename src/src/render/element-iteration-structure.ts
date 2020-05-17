import { IScope } from "../page/interfaces/scope.interface";
import { ElementStructureAbstract, AttributeStructure } from "./element-structure-abstract";
import { ElementStructure } from "./element-structure";
import { IterationDirective } from "../directives/abstracts/iteration-directive";

export class ElementIterationStructure extends ElementStructureAbstract {
    from: ElementStructureAbstract = null
    
    constructor(from: ElementStructureAbstract) {
        super(from.scope);
        this.from = from;
        this.parent = from.parent;
        this.tagName = from.tagName;
        this.content = from.content;
        this.directivesInstance = [];
        this.attritubes = from.attritubes.filter(x => !x.isIterationDirective).map(x => new AttributeStructure(
            x.name, x.value, this, x.directiveType
        ));
        this.rawNode = from.rawNode.cloneNode();
        this.isVoid = from.isVoid;
        this.isPureElement = from.isPureElement;
        this.isRendered = false;
        this.compiledNode = null;
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
            child.attritubes = x.attritubes.map(x => new AttributeStructure(
                x.name, x.value, child, x.directiveType
            ));
            child.isRendered = false;
            child.rawNode = x.rawNode.cloneNode();
            child.children = (x.children.length > 0) ? this.cloneChildrensRecursive(x.children, child) : [];
            return child;
        });
    }

}