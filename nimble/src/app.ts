import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { Route } from './route/route';
import { StartConfig } from './start-config';
import { Router } from './route/router';
import { Render } from './render';
import { NimblePage } from './elements/nimble-page-element';
import { NimbleRouter } from './elements/nimble-router-element';

export class NimbleApp {
    private static app: NimbleApp;
    public render: Render;

    public rootElement: HTMLElement;

    public get routes() { return Router.routes; }

    constructor(public config: StartConfig) {
        this.defineRootElement(config.selector);
        Router.useHash = config.useHash;
        Router.defineRoutes(config.routes);
        this.render = new Render(this);
    }

    public static config(config: StartConfig){
        this.app = new NimbleApp(config);
        return this.app;
    }

    private defineRootElement(selector: string) {
        this.rootElement = document.querySelector(selector);
    }

    public start() {
        this.registerElements();
        Router.addListener('change', this.onRouteChange.bind(this));
        Router.addListener('startedLoading', this.onPageStartedLoading.bind(this));
        Router.addListener('finishedLoading', this.onPageFinishedLoading.bind(this));
        Router.addListener('errorLoading', this.onPageErrorLoading.bind(this));
        Router.start();
    }

    private registerElements() {
        window.customElements.define('nimble-page', NimblePage);
        window.customElements.define('nimble-router', NimbleRouter);
    }

    private onRouteChange(route: Route){
        console.log('CHENGED: '+ route.completePath());
    }

    private onPageStartedLoading(route: Route){
        console.log('LOADING...');
    }

    private onPageFinishedLoading(route: Route){
        console.log(route.pageInstance);
        console.log('LOADED');
        console.log('');
        this.render.renderRoute(route);
    }

    private onPageErrorLoading(error, route: Route){
        console.log(error);
    }
}