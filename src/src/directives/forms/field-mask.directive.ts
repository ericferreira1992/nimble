import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { isNullOrUndefined } from 'util';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';
import { ElementListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: ['field-mask']
})
export class FieldMaskDirective extends BaseFormFieldDirective {

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

    private get mask(): string { return this.value as string; }

    constructor(
        private listenerCollector: ElementListenersCollector,
    ) {
        super();
    }

    public onRender(): void {
        if (this.checkForm()) {
            if (this.elementIsValid()) {
                try {
                    this.checkValueOnInitialize();
                    this.listenerCollector.subscribe(this.element, 'keypress', this.onKeypress.bind(this), true);
                    this.listenerCollector.subscribe(this.element, 'input', this.onInput.bind(this), true);
                }
                catch (e) { console.error(e.message); }
            }
        }
    }
	
	public onChange(): void {
        if (this.checkForm()) {
			this.checkValueOnInitialize();
		}
	}

    public onDestroy() {
    }

    private elementIsValid() {
        if (!(this.element instanceof HTMLInputElement) || (this.element.type !== 'text' && this.element.type !== 'password')) {
            console.error(`The directive "${this.selector}" only applies in input with type="text".`);
            return false;
        }

        if (this.value === '' || isNullOrUndefined(this.value)) {
            console.warn(`The directive "${this.selector}" cannot works with empty value.`);
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

    private checkValueOnInitialize() {
        let element = this.element as HTMLInputElement;
        let value = (this.formField) ? this.formField.value : element.value;
        value = this.applyMask(isNullOrUndefined(value) ? '': value);
        
        element.value = value;
            
        if (this.formField && value !== this.formField.value)
            this.formField.setValue(value, { noNotify: true, noUpdateElement: true, noValidate: true });
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

        let nextsSequencialMaskChars = this.applyMaskInCharacter(nextCharacter, maskCharacter, valueLength);
        if (nextsSequencialMaskChars.includes(nextCharacter))
            event.preventDefault();
        element.value += nextsSequencialMaskChars;
    }

    private onInput(event: KeyboardEvent) {
        let element = this.element as HTMLInputElement;
        let value = this.applyMask(element.value);
        
        element.value = value;
            
        if (this.formField && value !== this.formField.value)
            this.formField.setValue((element as HTMLInputElement).value, { noUpdateElement: true });
    }

    private applyMaskInCharacter(nextChar: string, maskChar: string, position: number): string {
        if (
            (maskChar.toString() === this.RULES.CHARS.NUMBER && this.RULES.REGEX.NUMBER.test(nextChar.toString())) ||
            (maskChar.toString() === this.RULES.CHARS.LETTER && this.RULES.REGEX.LETTER.test(nextChar.toString()))
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

    private applyMask(value: string) {
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

        return value;
    }

    private isSpecialCharacter(char: string) {
        return !this.RULES.REGEX.LETTER.test(char.toString()) &&
               !this.RULES.REGEX.NUMBER.test(char.toString());
    }

}