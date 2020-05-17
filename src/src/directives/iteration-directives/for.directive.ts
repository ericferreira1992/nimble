import { IterationDirective } from '../abstracts/iteration-directive';
import { IScope } from '../../page/interfaces/scope.interface';
import { IterateDirectiveResponse, RenderAbstract } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';
import { isArray } from 'util';
import { Helper } from '../../providers/helper';

@PrepareIterateDirective({
    selector: ['for']
})
export class ForDirective extends IterationDirective {

    constructor(
        private render: RenderAbstract,
        private helper: Helper,
    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): IterateDirectiveResponse[] {
        let forExpression = (value as string).trim();

        if (forExpression.startsWith('(') && forExpression.endsWith(')')) {
            forExpression = forExpression.substr(1, forExpression.length - 2);
        }

        if (!forExpression.startsWith('let ') && !forExpression.startsWith('var ')) {
            element.remove();
            console.error(`SyntaxError: Invalid expression: ${forExpression}: the expression should look similar to this: let item of items`);
            return [];
        }

        let iterationVarName = forExpression.split(' ')[1];
        let iterationArray = {
            expressionOrName: forExpression.split(' ').slice(3).join(''),
            value: scope.eval(forExpression.split(' ').slice(3).join('')) as any[]
        };

        if (!isArray(iterationArray.value)) {
            element.remove();
            console.error(`SyntaxError: Invalid expression: ${iterationArray.expressionOrName} does not appear to be an array.`);
            return [];
        }

        let response: IterateDirectiveResponse[] = [];
        for(var i = 0; i < iterationArray.value.length; i++) {
            let item = iterationArray.value[i];
            let index = i;

            let existingVarNameBefore = iterationVarName in scope;
            let varValueBefore = existingVarNameBefore ? scope[iterationVarName] : null;
            
            response.push(new IterateDirectiveResponse({
                beginFn: () => {
                    scope[iterationVarName] = item;
                    scope['$index'] = index;
                },
                endFn: () => {
                    delete scope['$index'];
                    if (existingVarNameBefore) {
                        scope[iterationVarName] = varValueBefore;
                    }
                    else {
                        delete scope[iterationVarName];
                    }
                }
            }));
        }

        return response;
    }

    public onDestroy(selector: string, scope: IScope) {
    }
}