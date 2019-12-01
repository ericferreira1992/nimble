import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { FormField } from '../../forms/form-field';
import { Listener } from '../../render/listener';
import { isNullOrUndefined } from 'util';

@PrepareDirective({
    selector: ['field-mask']
})
export class FieldMaskDirective extends Directive {

    private RULES = {
        CHARS: {
            NUMBER: '0'.toString(),
            LETTER: 'Z'.toString(),
        },
        REGEX: {
            NUMBER: /[0-9]/,
            LETTER: /[a-zA-Z]/,
        }
    };

    private get formField(): FormField {
        let directive = this.getDirectiveBySelector('[form-field]');
        if (directive) {
            let selectorApplied = directive.selectorsApplied.find(x => x.selector === '[form-field]');
            if (selectorApplied) return selectorApplied.content;
        }
        return null;
    }

    private get mask(): string { return this.getValueOfSelector('field-mask') as string; }

    constructor(
        private listener: Listener
    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (this.elementIsValid(selector, value)) {
            try {
                this.listener.listen(element, 'keypress', this.onKeypress.bind(this));
                this.listener.listen(element, 'input', this.onInput.bind(this));
            }
            catch (e) { console.error(e.message); }
        }
    }

    private elementIsValid(selector: string, value: any) {
        if (!(this.element instanceof HTMLInputElement) || (this.element.type !== 'text' && this.element.type !== 'password')) {
            console.error(`The directive "${selector}" only applies in input with type="text".`);
            return false;
        }

        if (value === '' || isNullOrUndefined(value)) {
            console.warn(`The directive "${selector}" cannot works with empty value.`);
            return false;
        }

        return true;
    }

    private characterInKeypressIsValid(nextChar: string, maskChar: string) {
        if (maskChar.toString() === this.RULES.CHARS.NUMBER) {
            return this.RULES.REGEX.NUMBER.test(nextChar.toString());
        }
        if (maskChar.toString() === this.RULES.CHARS.LETTER) {
            return this.RULES.REGEX.LETTER.test(nextChar.toString());
        }

        return true;
    }

    private characterAfterInputIsValid(nextChar: string, maskChar: string) {
        if (maskChar.toString() === this.RULES.CHARS.NUMBER) {
            return this.RULES.REGEX.NUMBER.test(nextChar.toString());
        }
        if (maskChar.toString() === this.RULES.CHARS.LETTER) {
            return this.RULES.REGEX.LETTER.test(nextChar.toString());
        }
        if (nextChar.toString() === maskChar.toString()) {
            return true;
        }

        return false;
    }

    private onKeypress(event: KeyboardEvent) {
        let element = this.element as HTMLInputElement;

        let value = element.value;
        let valueLength = value.length;
        let maskLength = this.mask.length;

        let nextCharacter = event.key;
        let maskCharacter = this.mask[valueLength];

        if (nextCharacter.length === 1) {
            if (valueLength >= maskLength){
                event.preventDefault();
                return;
            }
            if (!this.characterInKeypressIsValid(nextCharacter, maskCharacter)){
                event.preventDefault();
                return;
            }
        }

        if (!maskCharacter || nextCharacter.length > 1) {
            return;
        }

        element.value += this.applyMaskInCharacter(nextCharacter, maskCharacter, valueLength);
    }

    private onInput(event: KeyboardEvent) {
        event.stopImmediatePropagation();
        this.applyMask();
    }

    private applyMaskInCharacter(nextChar: string, maskChar: string, position: number): string {
        let element = this.element as HTMLInputElement;

        if (
            (maskChar.toString() === this.RULES.CHARS.NUMBER.toString() && this.RULES.REGEX.NUMBER.test(nextChar.toString())) ||
            (maskChar.toString() === this.RULES.CHARS.LETTER.toString() && this.RULES.REGEX.LETTER.test(nextChar.toString()))
        ) {
            return '';
        }
        
        return this.getNextSequencialMaskChars(position);
    }

    private getNextSequencialMaskChars(position: number){
        let sequencialChars = '';

        for(let i = position; i < this.mask.length; i++) {
            let char = this.mask[i].toString();
            if (!(char === this.RULES.CHARS.NUMBER && this.RULES.REGEX.NUMBER.test(char)) &&
                !(char === this.RULES.CHARS.LETTER && this.RULES.REGEX.LETTER.test(char)))
                sequencialChars += char;
            else
                break;
        }

        return sequencialChars;
    }

    private applyMask() {
        let element = this.element as HTMLInputElement;
        let value = element.value;

        for(var i = 0; i < value.length; i++) {
            let valueChar = value[i].toString();
            let maskChar = this.mask[i];

            if (!maskChar) {
                value = value.substr(0, i);
                break;
            }
            maskChar = maskChar.toString();

            if (this.characterAfterInputIsValid(valueChar, maskChar)) {
                let sequencialChars = this.applyMaskInCharacter(valueChar, maskChar, i);
                if (sequencialChars && valueChar !== maskChar) {
                    value += sequencialChars;
                }
            }
            else {
                if (this.isSpecialCharacter(maskChar)) {
                    if (valueChar !== maskChar) {
                        let left = value.substr(0, i);
                        let right = value.substr(i);
                        value =  left + maskChar + right;
                        continue;
                    }
                }
                value = value.substr(0, i) + value.substr(i + 1);
                i--;
            }
        } 
        
        if (value !== element.value)
            element.value = value;
            
        if (this.formField && value !== this.formField.value)
            this.formField.setValue((element as HTMLInputElement).value);
    }

    private isSpecialCharacter(char: string) {
        return !this.RULES.REGEX.LETTER.test(char.toString()) &&
               !this.RULES.REGEX.NUMBER.test(char.toString());
    }

}