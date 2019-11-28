import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';

@PrepareDirective({
    selector: [
        '(keydown)',
        '(keypress)',
        '(keyup)'
    ]
})
export class KeyboardEventsDirective extends Directive {

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        element.addEventListener(this.pureSelector(selector), (e) => {
            Object.assign(scope, { $event: e });
            scope.eval(value);
            delete scope['$event'];
        });
    }

}