import { NimbleApp } from '@nimble';
import { ROUTES } from './app/routes';
import './scss/style.scss';

import { AuthService } from './app/services/auth/auth.service';

NimbleApp.config({
    routes: ROUTES,
    directives: [],
    providers: [
        AuthService
    ]
}).start();