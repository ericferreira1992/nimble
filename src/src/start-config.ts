import { RouteBase } from './route/route-base';
import { Directive } from './directives/abstracts/directive';
import { Type } from './inject/type.interface';

export class StartConfig {
    public routes: RouteBase[];
    public directives?: Type<Directive>[] = [];
    public providers?: Type<{}>[] = [];
    public useHash?: boolean = true;
}