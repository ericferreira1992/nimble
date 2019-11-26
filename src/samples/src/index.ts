import './style.scss';
import { NimbleApp } from 'nimble';
import { ROUTES } from './app/routes';
import AuthService from './app/services/auth.service';

NimbleApp.config({
    routes: ROUTES,
    directives: [],
    providers: [
        AuthService
    ]
}).start();