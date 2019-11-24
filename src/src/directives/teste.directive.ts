import { IScope } from '../page/interfaces/scope.interface';
import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';

@PrepareDirective({
    selector: 'teste'
})
export class TesteDirective extends Directive {

    public resolve(value: any, element: HTMLElement, scope: IScope): void {

    }
}