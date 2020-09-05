import { IterationDirective } from '../abstracts/iteration-directive';
import { IterateDirectiveResponse } from "../../render/render-abstract";
import { PrepareIterateDirective } from '../decorators/prepare-iterate-directive.decor';

@PrepareIterateDirective({
    selector: ['if']
})
export class IfDirective extends IterationDirective {

    public onRender() {
    }
	
	public onIterate(): IterateDirectiveResponse[] {
        let success = !!(this.compile(this.value as string));
        return success ? [new IterateDirectiveResponse()] : [];
	}
	
	public onChange(): void {
	}

    public onDestroy() {
    }
}