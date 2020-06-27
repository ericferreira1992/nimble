import { IScope } from "../page/interfaces/scope.interface";
import { ElementStructure } from "./element-structure";
import { AttributeStructure } from "./element-structure-abstract";
import { Directive } from "../directives/abstracts/directive";

export class RenderHelper {
    public static isPureElement(tag: string | HTMLElement): boolean {
        if (tag instanceof HTMLElement) tag = tag.tagName;
        if ((typeof tag) === 'string') {
            return [
                'svg'
            ].indexOf(tag.toLowerCase()) != -1;
        }
        return false;
    }

    public static removeAllChildrenOfElement(element: Element) {
        if (element && element.children.length) {
            for (var i = 0; i < element.children.length; i++) {
                element.removeChild(element.children[i]);
            }
        }
    }

    public static resolveInterpolationIfHave(value: any, scope: IScope) {
        if (value) {
            value = value.toString();
            let regex = /{{(.|\n)*?}}/g;
            if (regex.test(value)) {
                value = value.replace(regex, (expression) => {
                    expression = expression.replace(/(^{{)|(}}$)/g, '');
                    if (expression !== '')
                        return scope.eval(expression);

                    return '';
                });
            }
            return value;
        }
        return '';
    }

    public static resolveDefaultAttribute(element: HTMLElement, name: string, value: string, scope: IScope) {
        if (name && value) {
            if (value) {
                let isInterpreted = /^\[([^)]+)\]$/g.test(name);
                if (isInterpreted) {
                    name = name.substr(1, name.length - 2);
                    value = scope.eval(value);
                }
                else 
                    value = this.resolveInterpolationIfHave(value, scope);

                if (name && value) {
                    if (!element.hasAttribute(name) || element.getAttribute(name) !== value) {
                        if (name === 'class') {
                            let newClasses = value.trim().split(' ');
                            newClasses.forEach(c => {
                                if (!element.classList.contains(c))
                                    element.classList.add(c);
                            });
                        }
                        else {
                            element.setAttribute(name, value);
                        }
                    } 
                    return;
                }
                if (isInterpreted) return;
            }
            
            if (element.hasAttribute(name)){
                element.removeAttribute(name);
            }
        }
    }

    public static buildStructureFromTemplate(htmlTemplate: string, scope: IScope, rootTagName: string): ElementStructure {
        htmlTemplate = htmlTemplate?.trim().replace(/<!--(.|\s)*?-->/g, '').trim() ?? '';
        if (htmlTemplate) {
            let serializer = new XMLSerializer();
            let domParser = new DOMParser();
            let documentParsed = domParser.parseFromString(`<${rootTagName}>${htmlTemplate}</${rootTagName}>`, 'text/html');
            let element = documentParsed.body.childNodes[0];

            let checkNode = (node: ChildNode): ElementStructure => {
                let structure = new ElementStructure(scope);
                if (node.nodeType !== Node.TEXT_NODE) {
                    structure.tagName = (node as HTMLElement).tagName.toLowerCase();
                    structure.attritubes  = checkAttributes((node as HTMLElement).attributes, structure);

                    if (RenderHelper.isPureElement(structure.tagName)) {
                        let attributes = (node as HTMLElement).attributes;
                        if (attributes.length > 0) {
                            do{
                                (node as HTMLElement).removeAttributeNode(attributes[0]);
                            } while((node as HTMLElement).attributes.length > 0)
                        }
                        structure.rawNode = node;
                        structure.isPureElement = true;
                    }
                    else {
                        structure.isVoid = ((node as HTMLElement).outerHTML || serializer.serializeToString(node)).indexOf("></") < 0;

                        if ((node as HTMLElement).innerHTML.trim() !== '')
                            structure.children = checkChildNodes(node.childNodes, structure);
                    }
                }
                else {
                    structure.isVoid = true;
                    structure.content = node.textContent;
                }

                return structure;
            };

            let checkChildNodes = (children: NodeListOf<ChildNode>, parent: ElementStructure): ElementStructure[] => {
                let structures: ElementStructure[] = [];
                if (children.length > 0) {
                    for(let i = 0; i < children.length; i++) {
                        let estruture = checkNode(children[i]);
                        estruture.parent = parent
                        structures.push(estruture);
                    }
                }

                return structures;
            };

            let checkAttributes = (attrs: NamedNodeMap, strucutre: ElementStructure): AttributeStructure<Directive>[] => {
                let attributes: AttributeStructure<Directive>[] = [];

                if (attrs.length > 0) {
                    for(let i = 0; i < attrs.length; i++) {
                        let attr = new AttributeStructure(
                            attrs[i].name,
                            attrs[i].value,
                            strucutre
                        );
                        attributes.push(attr);
                    }
                }

                return attributes;
            };

            let structured = checkNode(element) as ElementStructure;
            element.remove();

            return structured;
        }
        return new ElementStructure(scope);
    }
}