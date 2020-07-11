import { IterationDirective } from '../abstracts/iteration-directive';
import { IterateDirectiveResponse } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';
import { isArray } from 'util';

@PrepareIterateDirective({
    selector: 'for'
})
export class ForDirective extends IterationDirective {

    constructor() {
        super();
    }

    public resolve(selector: string, value: any): IterateDirectiveResponse[] {
        let expression = (value as string).trim();

        if (expression.startsWith('(') && expression.endsWith(')')) {
            expression = expression.substr(1, expression.length - 2);
        }

        // if (!forExpression.startsWith('let ') && !forExpression.startsWith('var ')) {
        //     this.element.remove();
        //     console.error(`SyntaxError: Invalid expression: ${forExpression}: the expression should look similar to this: let item of items`);
        //     return [];
		// }
		
		const startWithVariable = expression.startsWith('let ') || expression.startsWith('var ') || expression.startsWith('const ');
        let iterationVarName = expression.split(' ')[startWithVariable ? 1 : 0];
        let iterationArray = {
            expressionOrName: expression.split(' ').slice(startWithVariable ? 3 : 2).join(''),
            value: this.compile(expression.split(' ').slice(startWithVariable ? 3 : 2).join('')) as any[]
        };

        if (!isArray(iterationArray.value)) {
            this.element.remove();
            console.error(`SyntaxError: Invalid expression: ${iterationArray.expressionOrName} does not appear to be an array.`);
            return [];
        }

        let response: IterateDirectiveResponse[] = [];
        for(var i = 0; i < iterationArray.value.length; i++) {
            let item = iterationArray.value[i];
            let index = i;

            let existingVarNameBefore = iterationVarName in this.scope;
            let varValueBefore = existingVarNameBefore ? this.scope[iterationVarName] : null;
            
            response.push(new IterateDirectiveResponse({
                beginFn: () => {
                    this.scope[iterationVarName] = item;
                    this.scope['$index'] = index;
                },
                endFn: () => {
                    delete this.scope['$index'];
                    if (existingVarNameBefore) {
                        this.scope[iterationVarName] = varValueBefore;
                    }
                    else {
                        delete this.scope[iterationVarName];
                    }
                }
            }));
        }

        return response;
    }

    public onDestroy(selector: string) {
    }
}