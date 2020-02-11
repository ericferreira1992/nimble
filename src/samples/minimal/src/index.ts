import './style.scss';
import { NimbleApp } from '@nimble-ts/core';
import { ROUTES } from './app/routes';
import { AuthService } from './app/services/auth/auth.service';

NimbleApp.config({
    routes: ROUTES,
    directives: [],
    providers: [
        AuthService
    ]
}).start();