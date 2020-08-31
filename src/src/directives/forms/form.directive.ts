import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Form } from '../../forms';
import { ElementListenersCollector } from '../../providers/listeners-collector';
import { isNullOrUndefined } from 'util';
import { ObserverListener } from '../../core/observer';

@PrepareDirective({
    selector: '[form]',
	inputs: ['render-on-interact'],
	outputs: ['submit'],
})
export class FormDirective extends Directive {

    public get form() { return this.value as Form; }

    private subscribes: { id: string, observation: ObserverListener<Event> }[] = [];

    constructor(
        private listenersCollector: ElementListenersCollector
    ) {
        super();
    }

    public onRender(): void {
        if (this.isValid()) {
			this.resolve();
			this.onSubmitOutput();
			this.resolveRenderOnInteractSelector();
        }
	}
	
	public onChange(): void {

	}

    public onDestroy() {
		for(let sub of this.subscribes)
			sub.observation.unsubscribe();
    }

    private isValid() {
        if (!(this.element instanceof HTMLFormElement)) {
            console.error(`The directive "${this.selector}" only applies in form elements.`);
            return false;
        }

        return true;
    }

    private resolve(){
		this.form.scope = this.scope;
		this.form.formElement = this.element as HTMLFormElement;
		this.checkSubmitDirective();
    }

    private onSubmitOutput() {
		if (this.outputs.submit && !this.subscribes.find(x => x.id === 'fromDirective')) {
			this.subscribes.push({
				id: 'fromDirective',
				observation: this.form.onSubmit.subscribe((e) => {
					this.outputs.submit(e);
					e.preventDefault();
				})
			});
		}
    }

    private checkSubmitDirective() {
        if (!this.outputs.submit && this.listenersCollector.getSubscribedsByTargetAndEventName(this.element, 'submit').length <= 1) {
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

    private resolveRenderOnInteractSelector(){
		let value = this.inputs.renderOnInteract;
		this.form.renderOnInteract = (typeof value === 'boolean') ? value : !!(isNullOrUndefined(value) || value === '');
	}

}