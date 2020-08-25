import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Form } from '../../forms';
import { ElementListenersCollector } from '../../providers/listeners-collector';
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

    private subscribes: { id: string, observation: ObserverListener<Event> }[] = [];

    constructor(
        private listenersCollector: ElementListenersCollector
    ) {
        super();
    }

    public onResolve(selector: string, value: any): void {
        if (this.isValid(selector)) {
            selector = this.pureSelector(selector);
            if (selector === 'form')
                this.resolveFormSelector();
            else if (selector === 'submit')
                this.resolveSubmitSelector(value);
            else if (selector === 'render-on-interact')
                this.resolveRenderOnInteractSelector(value);
        }
    }

    public onDestroy() {
		for(let sub of this.subscribes)
			sub.observation.unsubscribe();
    }

    private isValid(selector: string) {
        if (!(this.element instanceof HTMLFormElement)) {
            console.error(`The directive "${selector}" only applies in form elements.`);
            return false;
        }

        return true;
    }

    private resolveFormSelector(){
        if (this.selectorIsValid('[form]')) {
            this.form.scope = this.scope;
            this.form.formElement = this.element as HTMLFormElement;
            this.checkSubmitDirective();
        }
    }

    private resolveSubmitSelector(value: any) {
        if (this.selectorIsValid('(submit)')) {
			if (!this.subscribes.find(x => x.id === 'fromDirective')) {
				this.subscribes.push({
					id: 'fromDirective',
					observation: this.form.onSubmit.subscribe((e) => {
						Object.assign(this.scope, { $event: e });
						this.scope.compile(value);
						delete this.scope['$event'];
		
						e.preventDefault();
					})
				});
			}
		}
    }

    private checkSubmitDirective() {
        if (!this.selectorsApplied.some(x => x.selector === '(submit)') && this.listenersCollector.getSubscribedsByTargetAndEventName(this.element, 'submit').length <= 1) {
			if (!this.subscribes.find(x => x.id === 'internal')) {
				this.subscribes.push({
					id: 'internal',
					observation: this.form.onSubmit.subscribe((e) => {
						e.preventDefault();
					})
				});
			}
		}
    }

    private resolveRenderOnInteractSelector(value: any){
        if (this.selectorIsValid('render-on-interact')) {
            this.form.renderOnInteract = (typeof value === 'boolean') ? value : !!(isNullOrUndefined(value) || value === '');
        }
	}
	
    private selectorIsValid(selector: string) {
        if (!(this.form instanceof Form)) {
            console.warn(`The directive "${selector}" works only with Form as value. Example: <form [form]="myForm">...`);
            return false;
        }
        return true;
    }

}