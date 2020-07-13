import { NimbleApp } from '@nimble-ts/core';
import { ROUTES } from './app/routes';

NimbleApp.config({
    routes: ROUTES,
    directives: [],
    providers: []
}).start();