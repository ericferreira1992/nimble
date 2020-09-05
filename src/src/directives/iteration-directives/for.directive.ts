import { IterationDirective } from '../abstracts/iteration-directive';
import { IterateDirectiveResponse } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';
import { isArray } from 'util';

@PrepareIterateDirective({
    selector: 'for'
})
export class ForDirective extends IterationDirective {

	private lastData: IterateDirectiveResponse[] = [];

    constructor() {
        super();
	}
	
    public onRender() {
    }
	
	public onIterate(): IterateDirectiveResponse[] {
        let expression = (this.value as string).trim();

        if (expression.startsWith('(') && expression.endsWith(')')) {
            expression = expression.substr(1, expression.length - 2);
        }
		
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

		if (this.lastData.length !== iterationArray.value.length) {
			this.lastData = iterationArray.value.map((item, index) => {
				let existingVarNameBefore = iterationVarName in this.scope;
				let varValueBefore = existingVarNameBefore ? this.scope[iterationVarName] : null;
				
				return new IterateDirectiveResponse({
					beginFn: () => {
						this.scope[iterationVarName] = iterationArray.value[index];
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
				});
			});
		}

        return this.lastData;
	}
	
	public onChange(): void {

	}

    public onDestroy() {
    }
}