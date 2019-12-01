import { Type } from '../inject/type.interface';
import { ApplicationRender } from '../render/application-render';
import { HeaderRender } from '../render/header-render';
import { AttributesRender } from '../render/attributes-render';
import { HttpClient } from './http-client/http-client';
import { Helper } from './helper';
import { ListenersCollector } from './listeners-collector';
import { Listener } from '../render/listener';

export const INTERNAL_PROVIDERS: Type<{}>[] = [
    Helper,
    ApplicationRender,
    HeaderRender,
    AttributesRender,
    HttpClient,
    Listener,
    ListenersCollector
];