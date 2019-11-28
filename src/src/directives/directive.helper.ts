import { NativesAttrsDirective } from './natives-attr.directive';
import { FormFieldDirective } from './forms/form-field.directive';

export class DirectiveHelper {

    public static getAllPureSelectors() {
        return [
            ...NativesAttrsDirective.selectorsMustHavePureValue,
            ...FormFieldDirective.selectorsMustHavePureValue,
        ].map(x => x.replace(/\[|\(|\]|\)/g, ''));
    }

    public static checkSelectorMustHavePureValue(selector: string) {
        selector = selector.replace(/\[|\(|\]|\)/g, '');
        return this.getAllPureSelectors().indexOf(selector) >= 0;
    }
}