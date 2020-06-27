import { Directive } from './abstracts/directive';
import { IterationDirective } from './abstracts/iteration-directive';
import { Type } from '../inject/type.interface';
import { IfDirective } from './iteration-directives/if.directive';
import { ForDirective } from './iteration-directives/for.directive';
import { HrefDirective } from './href.directive';
import { NativesAttrsDirective } from './natives-attr.directive';
import { ClipboardEventsDirective } from './events-directives/clipboard-events.directive';
import { DragEventsDirective } from './events-directives/drag-events.directive';
import { FormEventsDirective } from './events-directives/form-events.directive';
import { KeyboardEventsDirective } from './events-directives/keyboard-events.directive';
import { MouseEventsDirective } from './events-directives/mouse-events.directive';
import { FormFieldDirective } from './forms/form-field.directive';
import { FieldMaskDirective } from './forms/field-mask.directive';
import { FieldDateMaskDirective } from './forms/field-date-mask.directive';
import { FieldCurrencyMaskDirective } from './forms/field-currency-mask.directive';
import { FormDirective } from './forms/form.directive';
import { ElementsDirective } from './elements.directive';

export const INTERNAL_DIRECTIVES: Type<Directive | IterationDirective>[] = [
    IfDirective,
    ForDirective,
    HrefDirective,
    NativesAttrsDirective,
    ElementsDirective,
    ClipboardEventsDirective,
    DragEventsDirective,
    FormEventsDirective,
    KeyboardEventsDirective,
    MouseEventsDirective,
    FormDirective,
    FormFieldDirective,
    FieldMaskDirective,
    FieldDateMaskDirective,
    FieldCurrencyMaskDirective
];