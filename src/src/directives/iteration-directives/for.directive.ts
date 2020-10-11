import { IterationDirective } from '../abstracts/iteration-directive';
import { IterateDirectiveResponse } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';
import { isArray } from 'util';

@PrepareIterateDirective({
    selector: 'for'
})
export class ForDirective extends IterationDirective {

	private last = {
		iteration: [] as IterateDirectiveResponse[],
		data: [],
	};

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
        const iterationVarName = expression.split(' ')[startWithVariable ? 1 : 0];
        const iterationArray = {
            expressionOrName: expression.split(' ').slice(startWithVariable ? 3 : 2).join(''),
            value: this.compile(expression.split(' ').slice(startWithVariable ? 3 : 2).join('')) as any[]
        };

        if (!isArray(iterationArray.value)) {
            this.element.remove();
            console.error(`SyntaxError: Invalid expression: ${iterationArray.expressionOrName} does not appear to be an array.`);
            return [];
		}

		let existingVarNameBefore = false;
		let varValueBefore = null;

		this.last.data = iterationArray.value;
		if (this.last.iteration.length !== iterationArray.value.length) {
			this.last.iteration = iterationArray.value.map((_, i) => new IterateDirectiveResponse({
				beginFn: () => {
					existingVarNameBefore = iterationVarName in this.scope;
					varValueBefore = existingVarNameBefore ? this.scope[iterationVarName] : null;
					
					this.scope[iterationVarName] = this.last.data[i];
					this.scope['$index'] = i;
				},
				endFn: () => {
					delete this.scope['$index'];
					if (existingVarNameBefore)
						this.scope[iterationVarName] = varValueBefore;
					else
						delete this.scope[iterationVarName];
				}
			}));
		}

        return this.last.iteration;
	}
	
	public onChange(): void {

	}

    public onDestroy() {
    }
}