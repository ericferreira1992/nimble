import { NativesAttrsDirective, NATIVE_SELECTORS } from './natives-attr.directive';

export class DirectiveHelper {

    public static getAllPureSelectors() {
        return [
            ...NativesAttrsDirective.selectorsMustHavePureValue,
        ].map(x => x.replace(/\[|\(|\]|\)/g, ''));
    }

    public static checkSelectorMustHavePureValue(selector: string) {
        selector = selector.replace(/\[|\(|\]|\)/g, '');
        return this.getAllPureSelectors().indexOf(selector) >= 0;
    }

    public static isNativeSelector(selector: string) {
        selector = selector.replace(/\[|\(|\]|\)/g, '');
        return NATIVE_SELECTORS.some(x => x.replace(/\[|\(|\]|\)/g, '') === selector);
    }
}