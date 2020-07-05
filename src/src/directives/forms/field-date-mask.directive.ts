import { isNullOrUndefined } from 'util';
import { IScope } from '../../page/interfaces/scope.interface';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Helper } from '../../providers/helper';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';
import { ListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: ['field-date-mask']
})
export class FieldDateMaskDirective extends BaseFormFieldDirective {

    private get format(): string { return this.getValueOfSelector('field-date-mask') as string; }
    private set format(value: string) { this.setValueOfSelector('field-date-mask', value); }

    private separator: string;
    private regex: RegExp;

    private previousIsBackspace: boolean = false;

    constructor(
        private helper: Helper,
        private listenerCollector: ListenersCollector,
    ) {
        super();
    }

    public resolve(selector: string, value: any): void {
        if (this.checkForm()) {
            if (this.elementIsValid(selector, value)) {
                try {
                    this.prepareRegex();
                    this.checkValueOnInitialize();
                    this.listenerCollector.subscribe(this.element, 'keypress', this.onKeypress.bind(this), true);
                    this.listenerCollector.subscribe(this.element, 'keydown', this.onKeydown.bind(this), true);
                    this.listenerCollector.subscribe(this.element, 'input', this.onInput.bind(this), true);
                }
                catch (e) { console.error(e.message); }
            }
        }
    }

    public onDestroy(selector: string) {
    }

    private checkValueOnInitialize() {
        let element = this.element as HTMLInputElement;
        let value = (this.formField ? this.formField.value : element.value) as string;
        value = typeof value === 'string'? value.replace(/[^\d]/g, '') : '';
        if (!value.match(this.regex)) {
            value = value.replace(/[^\d]/g, '');
            value = this.applyMask(value);
        }
        else {
            value = '';
        }

        element.value = value;
        if (this.formField && value !== this.formField.value)
            this.formField.setValue(element.value, { noNotify: true, noUpdateElement: true, noValidate: true });
    }

    private elementIsValid(selector: string, value: any) {
        if (!(this.element instanceof HTMLInputElement) || this.element.type !== 'text') {
            console.error(`The directive "${selector}" only applies in input with type="text".`);
            return false;
        }

        if (value === '' || isNullOrUndefined(value)) {
            console.warn(`The directive "${selector}" cannot works with empty value.`);
            return false;
        }

        return true;
    }

    private prepareRegex() {
        let regexStr = '';
        if (this.format) {
            if (!this.format.includes('-') && !this.format.includes('/')) {
                if (this.format.toLowerCase() === 'dd')
                    regexStr += '([0-2]\\d{1}|3[0-1])';
                else if (this.format.toLowerCase() === 'mm')
                    regexStr += '(0\\d{1}|1[0-2])';
                else if (this.format.toLowerCase() === 'yyyy')
                    regexStr += '\\d{4}';
            }
            else if (this.format.includes('-') || this.format.includes('/')) {
                this.separator = this.format.includes('-') ? '-' : '/';
                let splitted = this.format.split(this.separator);
                splitted.forEach((division) => {
                    let divisionRegex = '';
                    if (division.toLowerCase() === 'dd')
                        divisionRegex = '([0-2]\\d{1}|3[0-1])';
                    else if (division.toLowerCase() === 'mm')
                        divisionRegex = '(0\\d{1}|1[0-2])';
                    else if (division.toLowerCase() === 'yyyy')
                        divisionRegex = '\\d{4}';
    
                    if (divisionRegex)
                        regexStr += (regexStr !== '' ? this.separator : '') + divisionRegex;
                });
            }
        }
        
        if (regexStr === '') {
            this.separator = '/';
            this.format = 'dd/MM/yyyy';
            regexStr = '([0-2]\\d{1}|3[0-1])/(0\d{1}|1[0-2])/\\d{4}';
        }
        
        this.regex = new RegExp(regexStr, 'g');
    }

    private onKeypress(event: KeyboardEvent) {
        let element = this.element as HTMLInputElement;
        let nextDigit = event.key;
        let currentValue = element.value;
        let nextValue = currentValue;
        let startIndex = element.selectionStart;
        let endIndex = element.selectionEnd;

        if (nextDigit.length === 1) {
            if ((currentValue.length < this.format.length || startIndex !== endIndex) && /^\d+$/.test(nextDigit)) {
                nextValue = this.helper.insertInTextWithInterval(currentValue, nextDigit, element.selectionStart, element.selectionEnd);
                let response = this.checkDateIsValid(nextValue);
                if (!response.valid) {
                    event.preventDefault();
                    return;
                }
                else if (response.nextValue) {
                    element.value = nextValue + response.nextValue;
                    event.preventDefault();
                    
                    element.dispatchEvent(new Event('input', {
                        bubbles: false,
                        cancelable: true,
                    }));
                }
            }
            else
                event.preventDefault();
        }
    }

    private onKeydown(event: KeyboardEvent) {
        this.previousIsBackspace = this.isBackspace(event);
    }

    private onInput(event: KeyboardEvent) {
        try {
            let element = (this.element as HTMLInputElement);
            let value = element.value;

            if (!this.previousIsBackspace) {
                if (!value.match(this.regex)) {
                    value = value.replace(/[^\d]/g, '');
                    value = this.applyMask(value);
                    element.value = value;
                }
                else
                    event.preventDefault();
            }

            if (this.formField && value !== this.formField.value)
                this.formField.setValue(element.value, { noUpdateElement: true });
        }
        finally{
            this.previousIsBackspace = false;
        }
    }

    private checkDateIsValid(currentValue: string): { valid: boolean, formatedValue: string, nextValue: string } {
        let object = {
            valid: false,
            formatedValue: '',
            nextValue: '',
        };
        currentValue = currentValue.substr(0, this.format.length);
        if (currentValue.length !== this.format.length) {
            let newValue = '';
            if (this.separator) {
                for(var i = 0; i < this.format.length; i++) {
                    let format = this.format[i];
                    let length = i + 1;
    
                    if (format === this.separator) {
                        if (i === currentValue.length)
                            object.nextValue = this.separator
                        newValue += format;
                    }
                    else {
                        if (length <= currentValue.length) {
                            let currentIndex = i - (newValue.split(this.separator).length - 1);
                            newValue += currentValue.replace(/[^\d]/g, '')[currentIndex];
                        }
                        else
                            newValue += '1';
                    }
                }
            }
            object.formatedValue = newValue;
        }
        else
            object.formatedValue = currentValue;

        object.valid = !isNullOrUndefined(object.formatedValue.match(this.regex));

        return object;
    }

    private applyMask(value: string) {
        value = (value ? value : '').substr(0, this.format.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/, '').length);
        let valueLength = value.length;
        if (value) {
            let newValue = '';
            for(var i = 0; i < valueLength; i++) {
                let valueChar = value[i];
                let formatChar = this.format[i + (newValue.split(this.separator).length - 1)];

                if (formatChar === this.separator)
                    newValue += this.separator;
                newValue += valueChar;
            }

            //if (newValue.length < this.format.length && this.format[newValue.length] === this.separator)
                // newValue += this.separator;

            newValue = newValue.substr(0, this.format.length);

            return newValue;
        }
        return value;
    }

    private isBackspace(event: KeyboardEvent) {
        let key = event.keyCode || event.charCode;
        return key == 8 || key == 46;
    }
}