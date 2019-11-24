import { Type } from '../inject/type.interface';
import { Render } from '../render/render';
import { HeaderRender } from '../render/header-render';
import { DirectivesRender } from '../render/directives-render';

export const INTERNAL_PROVIDERS: Type<any>[] = [
    Render,
    HeaderRender,
    DirectivesRender,
];