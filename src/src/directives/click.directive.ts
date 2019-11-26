import { IScope } from '../page/interfaces/scope.interface';
import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';

@PrepareDirective({
    selector: '(click)'
})
export class ClickDirective extends Directive {

    public resolve(value: any, element: HTMLElement, scope: IScope): void {
        element.addEventListener('click', (e) => {
            Object.assign(scope, { $event: e });
            scope.eval(value);
            delete scope['$event'];
        });
    }

}