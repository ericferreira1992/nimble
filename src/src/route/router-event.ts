import { Route } from "./route";
import { RouterState } from "./router-state.enum";

export class RouterEvent {
	route: Route;
	state: RouterState;
	
	constructor(obj: Partial<RouterEvent>) {
		Object.assign(this, obj);
	}
}