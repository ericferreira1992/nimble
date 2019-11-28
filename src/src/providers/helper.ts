import { Injectable } from "../inject/injectable";

@Injectable({ single: true })
export class Helper {

    public uid() {
		let pad4 = (num: number) => {
			let ret: string = num.toString(16);
			while (ret.length < 4) {
				ret = '0' + ret;
			}
			return ret;
		};
		
		let random4 = () => {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}

		if (typeof (window) !== 'undefined' && typeof (window.crypto) !== 'undefined' && typeof (window.crypto.getRandomValues) !== 'undefined') {
			let buf: Uint16Array = new Uint16Array(8);
			window.crypto.getRandomValues(buf);
			return (pad4(buf[0]) + pad4(buf[1]) + '-' + pad4(buf[2]) + '-' + pad4(buf[3]) + '-' + pad4(buf[4]) + '-' + pad4(buf[5]) + pad4(buf[6]) + pad4(buf[7]));
		}
		else
			return random4() + random4() + '-' + random4() + '-' + random4() + '-' + random4() + '-' + random4() + random4() + random4();
	}

	public splitStringJSONtoKeyValue(jsonString: string): { key: string, value: string }[] {
		let list = [];
		jsonString.replace(/(?:\"|\')([^"]*)(?:\"|\')(?=:)(?:\:\s*)(?:\")?(true|false|[-0-9]+[\.]*[\d]*(?=,)|[0-9a-zA-Z\(\)\@\:\,\/\!\+\-\.\$\#\ \\\']*)(?:\")?/g,
			(track) => {
				if (track) {
					track = track.trim();
					let splitIndex = track.indexOf(':');
					if (splitIndex > 2) {
						let key = track.substr(0, splitIndex)
									.trim()
									.replace(/(\"|\')/g, '')
									.trim();
						let value = track.substr(splitIndex + 1).trim()
																.replace(/\,$/g, '')
																.trim();
						list.push({ key: key, value: value });
					}
				}
				return '';
			}
		);
		return list;
	}
}