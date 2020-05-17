import { isNullOrUndefined } from 'util';
import { FormField } from './form-field';

export class Validators {
    public static required = (formField: FormField) => {
        if (formField) {
            if (isNullOrUndefined(formField.value) || formField.value === '')
                return { required: true };
        }
        return { required: false };
    };

    public static min(value: number) {
        return (formField: FormField) => {
            if (formField && !isNullOrUndefined(formField.value) && formField.value !== '' && formField.value < value) 
                return { min: value };
            return { min: false };
        }
    }

    public static max(value: number) {
        return (formField: FormField) => {
            if (formField && !isNullOrUndefined(formField.value) && formField.value !== '' && formField.value > value) 
                return { max: value };
            return { max: false };
        }
    }

    public static minLength(value: number) {
        return (formField: FormField) => {
            let length = ((formField && !isNullOrUndefined(formField.value) ? formField.value.toString() : '') as string).length;
            return { minLength: length < value ? value : false };
        }
    }

    public static maxLength(value: number) {
        return (formField: FormField) => {
            let length = ((formField && !isNullOrUndefined(formField.value) ? formField.value.toString() : '') as string).length;
            return { maxLength: length > value ? value : false };
        }
    }

    public static email = (formField: FormField) => {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (formField.value && !isNullOrUndefined(formField.value) && !regex.test(formField.value))
            return { email: true };
        return { email: false };
    }

    public static pattern(value: string | RegExp) {
        let regex = typeof value === 'string' ? new RegExp(value) : value;
        return (formField: FormField) => {
            if (formField.value && !isNullOrUndefined(formField.value) && !regex.test(formField.value))
                return { pattern: true };
            return { pattern: false };
        }
    }
}