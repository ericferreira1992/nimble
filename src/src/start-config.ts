import { RouteBase } from './route/route-base';
import { Directive } from './directives/abstracts/directive';

export class StartConfig {
    public routes: RouteBase[];
    public directives?: { new (): Directive }[] = [];
    public providers?: { new (): any }[] = [];
    public useHash?: boolean = true;
}