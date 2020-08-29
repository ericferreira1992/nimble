import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { isNullOrUndefined, isObject } from 'util';
import { Helper } from '../../providers/helper';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';
import { ElementListenersCollector } from '../../providers/listeners-collector';

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

    private get prefix(): string { return this.options.prefix ?? ''; }
    private get decimalSymbol(): string { return this.options.decimal ?? ','; }
    private get thousandsSymbol(): string { return this.options.thousands ?? '.'; }
    private get precision(): number { return this.options.precision ?? 2; }

    constructor(
        private helper: Helper,
        private listenerCollector: ElementListenersCollector,
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

    private defineOptions(value: any) {
        if (isObject(value))
            Object.assign(this.options, value);
        else if (!isNullOrUndefined(value))
            this.options.prefix = value.toString();
    }

    private checkValueOnInitialize() {
        let element = this.element as HTMLInputElement;
        let value = (this.formField) ? this.formField.value : element.value.replace(/[^\d]/g, '');
        value = this.applyMask(value, false);

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

    private applyMask(value: string | number, fromTyping: boolean = true) {
		value = value ? value : 0;
		
		if (typeof value === 'string') {
			if (fromTyping) {
				value = value.replace(/([^0-9]*)/g, '').replace(/^0+/g, '');
			}
			else  {
				let expression = this.prefix ? `([${this.prefix}| ]*)` : '([ ]*)'
				value = value.toString().replace(new RegExp(expression, 'g'), '');
				value = this.parseFloat(value);
			}
		}
		value = value.toString();
		
		let integer = '';
		let decimal = '';

		if (value.includes('.')) {
			integer = value.split('.')[0];
			decimal = this.helper.padRight(value.split('.')[1], this.precision);
		}
		else if (!fromTyping) {
			integer = value;
		}
		else {
			integer = value.substr(0, value.length - this.precision);
			decimal = value.length > this.precision ? value.substr(decimal.length - this.precision) : value;
		}

		integer = integer ? integer.replace(/(\d)(?=(?:[0-9]{3})+\b)/g, (v) => `${v}${this.thousandsSymbol}`) : '0';
		decimal = this.helper.padLeft(decimal, this.precision);

		value = `${integer}${this.decimalSymbol}${decimal}`;
		value = (this.prefix ? `${this.prefix} ` : '') + value;
        
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

    public onDestroy() {
    }
}
