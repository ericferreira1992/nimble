import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Form } from '../../core';
import { ListenersCollector } from '../../providers/listeners-collector';
import { isNullOrUndefined } from 'util';
import { ObserverListener } from '../../core/observer';

@PrepareDirective({
    selector: [
        '[form]',
        'render-on-interact',
        '(submit)',
    ]
})
export class FormDirective extends Directive {

    public get form() { return this.getValueOfSelector('[form]') as Form; }

    private subscribes: ObserverListener<Event>[] = [];

    constructor(
        private listenersCollector: ListenersCollector
    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (this.isValid(selector)) {
            selector = this.pureSelector(selector);
            if (selector === 'form')
                this.resolveFormSelector(scope);
            else if (selector === 'submit')
                this.resolveSubmitSelector(value, scope);
            else if (selector === 'render-on-interact')
                this.resolveRenderOnInteractSelector(value);
        }
    }

    public onDestroy(selector: string, scope: IScope) {
        selector = this.pureSelector(selector);
        if (selector === 'form' && this.form) {
            for(let sub of this.subscribes)
                sub.unsubscribe();
        }
    }

    private isValid(selector: string) {
        if (!(this.element instanceof HTMLFormElement)) {
            console.error(`The directive "${selector}" only applies in form elements.`);
            return false;
        }

        return true;
    }

    private resolveFormSelector(scope: IScope){
        if (this.formSelectorIsValid()) {
            this.form.scope = scope;
            this.form.formElement = this.element as HTMLFormElement;
            this.checkSubmitDirective();
        }
    }

    private resolveSubmitSelector(value: any, scope: IScope) {
        if (this.checkSubmitSelectorIsValid())
            this.subscribes.push(this.form.onSubmit.subscribe((e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];

                e.preventDefault();
            }));
    }

    private checkSubmitDirective() {
        if (!this.selectorsApplied.some(x => x.selector === '(submit)') && this.listenersCollector.getSubscribedsByTargetAndEventName(this.element, 'submit').length <= 1)
            this.subscribes.push(this.form.onSubmit.subscribe((e) => {
                e.preventDefault();
            }));
    }

    private resolveRenderOnInteractSelector(value: any){
        if (this.renderOnInteractSelectorIsValid()) {
            this.form.renderOnInteract = (typeof value === 'boolean') ? value : !!(isNullOrUndefined(value) || value === '');
        }
    }

    private renderOnInteractSelectorIsValid() {
        if (!(this.form instanceof Form)) {
            console.warn(`The directive "render-on-interact" works only with Form as value. Example: <form [form]="myForm">...`);
            return false;
        }

        return true;
    }

    private checkSubmitSelectorIsValid() {
        if (!(this.form instanceof Form)) {
            console.warn(`The directive "(submit)" works only with Form as value. Example: <form [form]="myForm">...`);
            return false;
        }

        return true;
    }

    private formSelectorIsValid() {
        if (!(this.form instanceof Form)) {
            console.warn(`The directive "[form]" works only with Form as value. Example: <form [form]="myForm">...`);
            return false;
        }

        return true;
    }

}