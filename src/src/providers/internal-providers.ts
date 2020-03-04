import { Type } from '../inject/type.interface';
import { PageRender } from '../page/page-render';
import { HeaderRender } from '../render/header-render';
import { AttributesRender } from '../render/attributes-render';
import { HttpClient } from './http-client/http-client';
import { Helper } from './helper';
import { ListenersCollector } from './listeners-collector';
import { Listener } from '../render/listener';
import { DialogBuilder } from '../dialog/dialog-builder';
import { DialogRender } from '../dialog/dialog-render';
import { DialogRefCollector } from '../dialog/dialog-ref-collector';
import { InternalObserversCollector } from './internal-observers-collector';
import { RouteParams } from './route-params/route-params';

export const INTERNAL_PROVIDERS: Type<{}>[] = [
    Helper,
    PageRender,
    DialogRender,
    DialogBuilder,
    DialogRefCollector,
    HeaderRender,
    AttributesRender,
    HttpClient,
    Listener,
    ListenersCollector,
    InternalObserversCollector,
    RouteParams
];