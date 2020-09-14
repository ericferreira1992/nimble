
import { NimbleApp, NimbleAppState } from '../app';
import { Router } from '../route';
import { RouterEvent } from '../route/router-event';
import { inPreRenderingStage } from '../utils';

declare module '../app' {
	interface NimbleApp {
		pluginGoogleAnalytics(this: NimbleApp, config: GAConfig): NimbleApp;
	}
}

NimbleApp.prototype.pluginGoogleAnalytics = function (this: NimbleApp, config: Partial<GAConfig>): NimbleApp {
	if (!config.disabled && !inPreRenderingStage()) {
		if (this.state === NimbleAppState.INITIALIZING) {
			window['dataLayer'] = window['dataLayer'] || [];
			const gtag = function(){ (window['dataLayer'] || []).push(arguments) } as any;

			let routeIsLoaded = false;
			let scriptIsLoaded = false;

			const src = `https://www.googletagmanager.com/gtag/js?id=${config.id}`;
			const exisingScript = document.head.querySelector(`[src="${src}"]`) as HTMLScriptElement;
			const onload = () => {
				scriptIsLoaded = true;
				if (routeIsLoaded) {
					gtag('config', config.id, {'page_path': `/${Router.currentPath}`});
					console.log(`Sended to GA: /${Router.currentPath}`);
				}
			};
			if (!exisingScript) {
				const script = document.createElement('script');
				script.async = true;
				script.onload = onload.bind(this);
				script.src = src;
				document.head.append(script);
			}
			else {
				exisingScript.onload = onload.bind(this);
			}

			gtag('js', new Date());
			gtag('config', config.id);

			Router.addListener('FINISHED_CHANGE', (event: RouterEvent) => {
				routeIsLoaded = true;
				if (scriptIsLoaded) {
					gtag('config', config.id, {'page_path': `/${event.route.completePath()}`});
					console.log(`Sended to GA: /${event.route.completePath()}`);
				}
			});
		}
		else {
			console.warn('The GoolgeAnalytics plugin only works before start() method of NimbleApp.');
		}
	}

	return this;
}

export class GAConfig {
	id: string;
	disabled?: boolean = false;
}