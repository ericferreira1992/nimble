import { isNullOrUndefined } from 'util';
import { FormField } from './form-field';

export class Validators {

	/**
	 * Validator for required field
	 */
    public static required = (formField: FormField) => {
        if (isNullOrUndefined(formField?.value) || formField?.value === '')
			return { required: true };
        return { required: false };
    };

	/**
	 * Validator required the value be true
	 */
    public static requiredTrue = (formField: FormField) => {
        if (formField && formField.value !== true)
			return { required: true };
        return { required: false };
    };

	/**
	 * Validator for minimum numberic value
	 */
    public static min(value: number) {
        return (formField: FormField) => {
            if (!isNullOrUndefined(formField?.value) && formField.value !== '' && formField.value < value) 
                return { min: value };
            return { min: false };
        }
    }

	/**
	 * Validator for maximum numberic value
	 */
    public static max(value: number) {
        return (formField: FormField) => {
            if (!isNullOrUndefined(formField?.value) && formField.value !== '' && formField.value > value) 
                return { max: value };
            return { max: false };
        }
    }

	/**
	 * Validator for minimum character length
	 */
    public static minLength(value: number) {
        return (formField: FormField) => {
            return { minLength: ((formField?.value ?? '').toString() as string).length < value ? value : false };
        }
    }

	/**
	 * Validator for maximum character length
	 */
    public static maxLength(value: number) {
        return (formField: FormField) => {
            return { maxLength: ((formField?.value ?? '').toString() as string).length > value ? value : false };
        }
    }

	/**
	 * Validator for minimum checkbox checked
	 */
    public static minChecked(value: number) {
        return (formField: FormField) => {
            return { minChecked: (formField?.value ?? []).length < value ? value : false };
        }
    }

	/**
	 * Validator for maximum checkbox checked
	 */
    public static maxChecked(value: number) {
        return (formField: FormField) => {
            return { maxChecked: (formField?.value ?? []).length > value ? value : false };
        }
    }

	/**
	 * Validator for email matcher
	 */
    public static email = (formField: FormField) => {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (formField.value && !isNullOrUndefined(formField.value) && !regex.test(formField.value))
            return { email: true };
        return { email: false };
    }

	/**
	 * Validator for regular expressions matcher
	 */
    public static pattern(value: string | RegExp) {
        let regex = typeof value === 'string' ? new RegExp(value) : value;
        return (formField: FormField) => {
            if (formField.value && !isNullOrUndefined(formField.value) && !regex.test(formField.value))
                return { pattern: true };
            return { pattern: false };
        }
    }
}