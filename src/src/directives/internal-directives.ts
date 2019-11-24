import { Directive } from './abstracts/directive';
import { IterationDirective } from './abstracts/iteration-directive';
import { Type } from '../inject/type.interface';
import { IfDirective } from './if.directive';
import { ForDirective } from './for.directive';
import { TesteDirective } from './teste.directive';

export const INTERNAL_DIRECTIVES: Type<Directive | IterationDirective>[] = [
    IfDirective,
    ForDirective,
    TesteDirective
];