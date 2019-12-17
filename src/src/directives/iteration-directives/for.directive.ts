import { IterationDirective } from '../abstracts/iteration-directive';
import { IScope } from '../../page/interfaces/scope.interface';
import { AfterIterateElement } from '../../render/attributes-render';
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';
import { isArray } from 'util';
import { AttributesRender } from '../../render/attributes-render';
import { Helper } from '../../providers/helper';

@PrepareIterateDirective({
    selector: 'for'
})
export class ForDirective extends IterationDirective {

    constructor(
        private attrRender: AttributesRender,
        private helper: Helper,
    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): AfterIterateElement {
        let resolved = new AfterIterateElement({
            resolvedAllElements: true
        });

        let forExpression = (value as string).trim();

        if (forExpression.startsWith('(') && forExpression.endsWith(')')) {
            forExpression = forExpression.substr(1, forExpression.length - 2);
        }

        if (!forExpression.startsWith('let ')) {
            element.remove();
            console.error(`SyntaxError: Invalid expression: ${forExpression}: the expression should look similar to this: let item of items`);
            resolved.removed = true;
            return resolved;
        }

        let iterationVarName = forExpression.split(' ')[1];
        let iterationArray = {
            expressionOrName: forExpression.split(' ').slice(3).join(''),
            value: scope.eval(forExpression.split(' ').slice(3).join('')) as any[]
        };

        if (!isArray(iterationArray.value)) {
            element.remove();
            console.error(`SyntaxError: Invalid expression: ${iterationArray.expressionOrName} does not appear to be an array.`);
            resolved.removed = true;
            return resolved;
        }

        let beforeElement = element;
        for(var i = 0; i < iterationArray.value.length; i++) {
            let iterateElement = element.cloneNode(true) as HTMLElement;
            beforeElement.insertAdjacentElement('afterend', iterateElement);
            beforeElement = iterateElement;

            let item = iterationArray.value[i];
            let index = i;
            
            this.attrRender.resolveElement(
                iterateElement,
                scope,
                () => {
                    scope[iterationVarName] = item;
                    scope['$index'] = index;
                },
                () => {
                    delete scope[iterationVarName];
                    delete scope['$index'];
                }
            );
        }

        element.remove();

        resolved.quantityNewChild = iterationArray.value.length - 1;

        return resolved;
    }

    public onDestroy(selector: string, scope: IScope) {
    }
}