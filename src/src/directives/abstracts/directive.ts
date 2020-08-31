import { IScope } from "../../page/interfaces/scope.interface";
import { Page } from "../../page/page";
import { Dialog } from "../../dialog/classes/dialog";
import { isNullOrUndefined } from "util";

export abstract class Directive {
	private _selectors: string[];
	private _inputs: string[];
	private _outputs: string[];

	public selectorActive: string;
	public all: () => Directive[] = () => [];
	public element?: HTMLElement;
	public scope: IScope;
	public inputs: { [key: string]: any } = {};
	public outputs: { [key: string]: (e?: any) => void } = {};
	public get selectors() {
		return this._selectors;
	}
	public get selector(): string {
		let selector = this.selectorActive;
		return (selector ?? '')
			.replace(/\(|\)/g, '')
			.replace(/\[|\]/g, '');
	}

	public get selectorIsInput() {
		return !this.selectorIsOutput;
	}
	public get selectorIsOutput() {
		let selector = this.selectorActive;
		return /^\(([^)]+)\)$/g.test(selector);
	}

	public get value(): any {
		if (this.selector) {
			if (this.selectorIsOutput)
				return this.outputs[this.selector];
			return this.inputs[this.selector];
		}
		return null;
	}

	insertInput(name: string, value: () => any) {
		if (this._inputs.indexOf(name) >= 0 || this._selectors.some(x => x.replace(/\[|\]/g, '') === name)) {
			Object.defineProperty(this.inputs, name, {
				get: () => { return value(); },
				enumerable: true,
				configurable: true
			});
		}
	}

	insertOutput(name: string, value: () => string) {
		if (this._outputs.indexOf(name) >= 0 || this._selectors.some(x => x === `(${name})`)) {
			this.outputs[name] = (e) => {
				let eventDefined = !isNullOrUndefined(e);
				eventDefined && Object.assign(this.scope, { $event: e });
				this.compile(value());
				eventDefined && (delete this.scope['$event']);
			};
		}
	}

	public render(action: () => void = null) {
		if (this.scope instanceof Page) {
			return this.scope.render(action);
		}
		else if (this.scope instanceof Dialog) {
			return this.scope.render(action);
		}
	}

	public compile(expression: string) {
		if (this.scope instanceof Page) {
			return this.scope.compile(expression);
		}
		else if (this.scope instanceof Dialog) {
			return this.scope.compile(expression);
		}
	}

	public get others() { return this.all().filter(x => x !== this); }
	/** This method will always be invoked when the render happens */
	abstract onRender(): void;

	/** This method will always be invoked when values changes */
	abstract onChange(): void;

	/** This method will always be invoked when the element it is linked to is removed from the DOM. */
	abstract onDestroy(): void;
}
