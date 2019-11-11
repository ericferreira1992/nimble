
import '@webcomponents/custom-elements/custom-elements.min';
import { Route } from './route/route';
import { StartConfig } from './start-config';
import { Router } from './route/router';
import { Render } from './render';
import { MisticPage } from './elements/mistic-page-element';
import { MisticRouter } from './elements/mistic-router-element';

export class MisticApp {
    private static app: MisticApp;
    public render: Render;

    public rootElement: HTMLElement;

    public get routes() { return Router.routes; }

    constructor(public config: StartConfig) {
        this.defineRootElement(config.selector);
        Router.defineRoutes(config.routes);
        this.render = new Render(this);
    }

    public static config(config: StartConfig){
        this.app = new MisticApp(config);
        return this.app;
    }

    private defineRootElement(selector: string) {
        this.rootElement = document.querySelector(selector);
    }

    public start() {
        this.registerElements();
        Router.start();
        Router.addListener('change', this.onRouteChange.bind(this));
        Router.addListener('startedLoading', this.onPageStartedLoading.bind(this));
        Router.addListener('finishedLoading', this.onPageFinishedLoading.bind(this));
        Router.addListener('errorLoading', this.onPageErrorLoading.bind(this));
    }

    private registerElements() {
        customElements.define('mistic-page', MisticPage);
        customElements.define('mistic-router', MisticRouter);
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