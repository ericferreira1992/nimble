
import { NimbleApp, NimbleAppState } from '../app';
import { Router } from '../route';
import { RouterEvent } from '../route/router-event';

declare module '../app' {
	interface NimbleApp {
		pluginGoogleAnalytics(this: NimbleApp, config: GAConfig): NimbleApp;
	}
}

NimbleApp.prototype.pluginGoogleAnalytics = function (this: NimbleApp, config: Partial<GAConfig>): NimbleApp {
	if (!config.disabled) {
		if (this.state === NimbleAppState.INITIALIZING) {
			let script = document.createElement('script');
			script.setAttribute('async', '');
			script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${config.id}`);
			document.head.append(script);

			window['dataLayer'] = window['dataLayer'] || [];
			const gtag = (a, b, c?) => {
				let args = [a, b];
				if (c) args.push(c);
				window['dataLayer'].push(args);
			};
			gtag('js', new Date());
			gtag('config', config.id);
			Router.addListener('FINISHED_CHANGE', (event: RouterEvent) => {
				gtag('config', config.id, {'page_path': `/${event.route.completePath()}` });
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