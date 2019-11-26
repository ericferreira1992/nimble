import { Directive } from './abstracts/directive';
import { IterationDirective } from './abstracts/iteration-directive';
import { Type } from '../inject/type.interface';
import { IfDirective } from './if.directive';
import { ForDirective } from './for.directive';
import { ClickDirective } from './click.directive';

export const INTERNAL_DIRECTIVES: Type<Directive | IterationDirective>[] = [
    IfDirective,
    ForDirective,
    ClickDirective
];