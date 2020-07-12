import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { isNullOrUndefined, isObject } from 'util';
import { Helper } from '../../providers/helper';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';
import { ListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: ['field-currency-mask']
})
export class FieldCurrencyMaskDirective extends BaseFormFieldDirective {
    
    private options = {
        prefix: '',
        decimal: ',',
        thousands: '.',
        precision: 2,
    };

    private get prefix(): string { return this.options.prefix; }
    private get decimalSymbol(): string { return this.options.decimal; }
    private get thousandsSymbol(): string { return this.options.thousands; }
    private get precision(): number { return this.options.precision; }

    constructor(
        private helper: Helper,
        private listenerCollector: ListenersCollector,
    ) {
        super();
    }

    public onResolve(selector: string, value: any): void {
        if (this.checkForm()) {
            if (this.elementIsValid(selector, value)) {
                try {
                    this.defineOptions(value);
                    this.checkValueOnInitialize();
                    this.listenerCollector.subscribe(this.element, 'keypress', this.onKeypress.bind(this), true);
                    this.listenerCollector.subscribe(this.element, 'input', this.onInput.bind(this), true);
                }
                catch (e) { console.error(e.message); }
            }
        }
    }

    public onDestroy() {
    }

    private defineOptions(value: any) {
        if (isObject(value))
            Object.assign(this.options, value);
        else if (!isNullOrUndefined(value))
            this.options.prefix = value.toString();
    }

    private checkValueOnInitialize() {
        let element = this.element as HTMLInputElement;
        let value = (this.formField) ? this.formField.value : element.value.replace(/[^\d]/g, '');
        value = this.applyMask(value);

        element.value = value;

        let floatValue = this.parseFloat(value);

        if (this.formField && floatValue !== this.formField.value)
            this.formField.setValue(floatValue, { noNotify: true, noUpdateElement: true, noValidate: true });
    }

    private elementIsValid(selector: string, value: any) {
        if (!(this.element instanceof HTMLInputElement) || this.element.type !== 'text') {
            console.error(`The directive "${selector}" only applies in input with type="text".`);
            return false;
        }

        return true;
    }

    private onKeypress(event: KeyboardEvent) {
        let element = this.element as HTMLInputElement;
        let nextDigit = event.key;
        let currentValue = element.value;
        let nextValue = currentValue;
        let startIndex = element.selectionStart;
        let endIndex = element.selectionEnd;

        if (nextDigit.length === 1) {
            if (!(/^\d+$/.test(nextDigit)))
                event.preventDefault();
        }
    }

    private onInput(event: KeyboardEvent) {
        let element = (this.element as HTMLInputElement);
        let value = element.value;

        value = this.applyMask(value);
        element.value = value;

        let floatValue = this.parseFloat(value);

        if (this.formField && floatValue !== this.formField.value)
            this.formField.setValue(floatValue, { noUpdateElement: true });
    }

    private applyMask(value: string | number) {
        let integer = '';
        let decimal = '';

        if (typeof value === 'number') {
            value = value.toString();
            if (value.includes('.')) {
                integer = value.split('.')[0];
                decimal = value.split('.')[1];
            }
            else {
                integer = value;
            }
        }
        else {
            value = (value ? value : '').replace(new RegExp(`([^0-9]*)`, 'g'), '');

            if (value !== '0')
                value = value.replace(/^[0\.]+/, '');
                                        
            if (value.includes(this.decimalSymbol)) {
                integer = value.split(this.decimalSymbol)[0];
                decimal = value.split(this.decimalSymbol)[1];
            }
            else if(value !== ''){
                if (value.length > this.precision) {
                    integer = value.substr(0, value.length - this.precision); 
                    decimal = value.substr(integer.length, this.precision); 
                }
                else
                    decimal = value; 
            }
        }

        if (integer !== '' || decimal !== '') {
            if (integer !== '') {
                let qttThousands = Math.floor(integer.length / 3);
                if (qttThousands > 0) {
                    let thousandsList = [];
                    let startIndex = integer.length - (qttThousands * 3);
                    value = (startIndex > 0) ? `${integer.substr(0, startIndex)}${this.thousandsSymbol}` : '';

                    for (var i = startIndex; i < integer.length; i += 3) {
                        let thousand = integer.substr(i, 3);
                        thousandsList.push(thousand);
                    }
                    value += thousandsList.join(this.thousandsSymbol);
                }
                else
                    value = integer;
            }

            if (decimal !== ''){
                decimal = this.helper.padLeft(decimal.substr(0, this.precision), this.precision);
                value = `${(integer === '') ? '0' : value}${this.decimalSymbol}${decimal}`;
            }
            else if (integer !== '')
                value += `${this.decimalSymbol}${this.helper.padLeft('', this.precision)}`;

            value = (this.prefix ? `${this.prefix} ` : '') + value;
        }
        
        return value;
    }

    private parseFloat(value: string) {
        if (this.prefix)
            value = value.replace(this.prefix, '').trim();

        value = value.replace(new RegExp(`[\/${this.thousandsSymbol}]`, 'g'), '');

        if (this.decimalSymbol !== '.')
            value = value.replace(this.decimalSymbol, '.');

        let floatValue = value !== '' ? parseFloat(value) : null;

        return floatValue;
    }
}
