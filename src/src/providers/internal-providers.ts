import { Type } from '../inject/type.interface';
import { RouteRender } from '../route/route-render';
import { HeaderRender } from '../render/header-render';
import { HttpClient } from './http-client/http-client';
import { Helper } from './helper';
import { ElementListenersCollector } from './listeners-collector';
import { ElementListener } from '../render/listener';
import { DialogBuilder } from '../dialog/dialog-builder';
import { DialogRender } from '../dialog/dialog-render';
import { DialogRefCollector } from '../dialog/dialog-ref-collector';
import { InternalObserversCollector } from './internal-observers-collector';
import { RouteParams } from './route-params/route-params';
import { RenderAbstract } from '../render/render-abstract';

export const INTERNAL_PROVIDERS: Type<{}>[] = [
    Helper,
    RenderAbstract,
    RouteRender,
    DialogRender,
    DialogBuilder,
    DialogRefCollector,
    HeaderRender,
    HttpClient,
    ElementListener,
    ElementListenersCollector,
    InternalObserversCollector,
    RouteParams
];