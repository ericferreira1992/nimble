import { Type } from '../inject/type.interface';
import { Render } from '../render/render';
import { HeaderRender } from '../render/header-render';
import { AttributesRender } from '../render/attributes-render';
import { HttpClient } from './http-client/http-client';
import { Helper } from './helper';

export const INTERNAL_PROVIDERS: Type<{}>[] = [
    Helper,
    Render,
    HeaderRender,
    AttributesRender,
    HttpClient,
];