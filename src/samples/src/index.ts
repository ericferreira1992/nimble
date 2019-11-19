import { ROUTES } from './app/routes';
import './style.scss';
import { NimbleApp } from 'nimble';

NimbleApp.config({
    routes: ROUTES
}).start();