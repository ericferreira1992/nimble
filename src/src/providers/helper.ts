import { Injectable } from "../inject/injectable";
import { isArray, isNullOrUndefined } from "util";

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
		let matchGroup = jsonString.replace(/\"/g, '\'').match(/(?:\"|\')([^("|'|)]*)(?:\"|\')(?=:)(?:\:\s*)(?:\")?(true|false|[0-9a-zA-Z\(\)\@\:\/\!\+\-\.\$\&\%\=\ \\\']*|[-0-9]+[\.]*[\d]*(?=,))(?:\")?/gm);
		for (let i = 0; i < matchGroup.length; i ++) {
			const keyValueSplitted = matchGroup[i].split(':');
			let key = keyValueSplitted[0].trim();
			let value = keyValueSplitted[1].trim()
				.replace(/\,$/g, '')
				.trim();

			if(/^('|").*('|")$/g.test(key)){
				key = eval(key);
			}

			list.push({ key, value });
		}
		return list;
	}

	public insertInText(target: string, source: string, index: number) {
		if ((typeof target === 'string') &&
			(typeof source === 'string' && source !== '') &&
			index >= 0) {
			let left = target.substr(0, index);
			let right = target.substr(index);
			target = left + source + right;
		}

		return target;
	}

	public insertInTextWithInterval(target: string, source: string, startIndex: number, endIndex: number) {
		if ((typeof target === 'string') &&
			(typeof source === 'string' && source !== '') &&
			startIndex >= 0 && endIndex >= 0 && (startIndex <= endIndex)) {
			let left = target.substr(0, startIndex);
			let right = target.substr(endIndex);
			target = left + source + right;
		}

		return target;
	}

	public cloneObject(obj: any) {
		return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
	}

	padLeft(text: string, qtty: number = 2, char: string | number = 0) {
		if (!isNullOrUndefined(text))
			while (text.length < qtty)
				text = char + text;

		return text;
	}

	padRight(text: string, qtty: number = 2, char: string | number = 0) {
		if (!isNullOrUndefined(text))
			while (text.length < qtty)
				text += char;

		return text;
	}
}