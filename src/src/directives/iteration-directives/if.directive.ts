import { IterationDirective } from '../abstracts/iteration-directive';
import { IScope } from '../../page/interfaces/scope.interface';
import { IterateDirectiveResponse } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';

@PrepareIterateDirective({
    selector: ['if']
})
export class IfDirective extends IterationDirective {

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): IterateDirectiveResponse[] {
        let success = scope.eval(value as string);

        if (!success)
            return [];
        else
            return [
                new IterateDirectiveResponse()
            ];
    }

    public onDestroy(selector: string, scope: IScope) {
    }
}