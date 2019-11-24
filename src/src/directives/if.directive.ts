import { IterationDirective } from './abstracts/iteration-directive';
import { IScope } from '../page/interfaces/scope.interface';
import { AfterIterateElement } from '../render/directives-render';
import { PrepareIterateDirective } from './decorators/prepare-iterate-directive.decor';

@PrepareIterateDirective({
    selector: 'if'
})
export class IfDirective extends IterationDirective {

    public resolve(value: any, element: HTMLElement, scope: IScope): AfterIterateElement {
        let success = scope.eval(value as string);

        if (!success)
            element.remove();

        return new AfterIterateElement({ removed: !success });
    }
}