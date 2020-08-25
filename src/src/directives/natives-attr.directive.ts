import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Helper } from '../providers/helper';
import { isArray } from 'util';

export const NATIVE_SELECTORS: string[] = [
    '[disabled]',
    'class',
    'style',
    'title',
    'alt',
    'type',
    'target',
    'src',
    'width',
    'height',
    'maxlength',
    'minlength',
];

@PrepareDirective({
    selector: NATIVE_SELECTORS
})
export class NativesAttrsDirective extends Directive {

    constructor(private helper: Helper) {
        super();
    }

    public static get selectorsMustHavePureValue() {
        return [
            'class',
            'style',
        ];
	}
	
	private previousValue = {
		class: {
			add: [] as string[],
			remove: [] as string[]
		},
		style: {
			add: [] as string[],
			remove: [] as string[]
		},
	};

    public onResolve(selector: string, value: any): void {
        selector = this.pureSelector(selector);

        if (selector === 'class')
            this.resolveClass(value);
        else if (selector === 'style')
            this.resolveStyle(value);
        else if (selector === 'disabled')
            this.resolveRequired(value);
        else {
            if (!this.element.hasAttribute(selector))
				this.element.setAttribute(selector, value);
            else if (this.element.attributes[selector].value !== value)
				this.element.attributes[selector].value = value;
        }
    }

    public onDestroy() {
    }

    private resolveClass(value: string) {
        if (value) {
            value = value.trim();
            let classesAdd: string[] = [];
            let classesRemove: string[] = [];

            if (value.startsWith('{') && value.endsWith('}')) {
                let listExpressions = this.helper.splitStringJSONtoKeyValue(value);
                listExpressions.forEach((keyValue) => {
                    try {
                        if (this.scope.compile(keyValue.value))
                            classesAdd.push(keyValue.key);
                        else
                            classesRemove.push(keyValue.key);
                    }
                    catch(e){
                        console.error(e.message);
                    }
                });
            }
            else if (value.startsWith('[') && value.endsWith(']')) {
                value = this.scope.compile(value);
                if (isArray(value))
					classesAdd = value;
				
				classesRemove = this.previousValue.class.add.filter(x => classesAdd.indexOf(x) < 0);
            }
            else{
                value = this.scope.compile(value);
                if (value && typeof value === 'string') {
                    value = value.trim();
                    if(value.includes(' '))
                        classesAdd = value.split(' ');
                    else
						classesAdd = [value];
						
					classesRemove = this.previousValue.class.add.filter(x => classesAdd.indexOf(x) < 0);
                }
            }

			if (classesAdd.sort().join(',') !== (this.previousValue.class.add ?? []).sort().join('')) {
				classesAdd.forEach(c => this.element?.classList.add(c));
			}
			if (classesRemove.sort().join(',') !== (this.previousValue.class.remove ?? []).sort().join('')) {
				classesRemove.forEach(c => this.element?.classList.remove(c));
			}
			
			this.previousValue.class = {
				add: classesAdd,
				remove: classesRemove,
			}
        }
    }

    private resolveStyle(value: string) {
        if (value) {
            value = value.trim();
            let toAdd: { prop: string, value: string }[] = [];
			
            if (value.startsWith('{') && value.endsWith('}')) {
                let listExpressions = this.helper.splitStringJSONtoKeyValue(value);
                listExpressions.forEach((keyValue) => {
                    try {
						toAdd.push({ prop: keyValue.key, value: this.compile(keyValue.value) });
                    }
                    catch(e){
                        console.error(e.message);
                    }
                });
            }
            else if (value.startsWith('[') && value.endsWith(']')) {
                value = this.scope.compile(value);
                if (isArray(value))
                    value.forEach((style) => {
                        if(style.includes(':')) {
                            try {
								toAdd.push({ prop: style.split(':')[0].trim(), value: style.split(':')[1].trim() });
                            }
                            catch(e){
                                console.error(e.message);
                            }
                        }
                    });
            }
            else {
                value = this.scope.compile(value);
                if (value && typeof value === 'string') {
                    value = value.replace(/\;\;\;/g, ';').replace(/\;\;/g, ';');
                    if (value.includes(';')) {
                        value.split(';').forEach((style) => {
                            if(style.includes(':')) {
                                try {
									toAdd.push({ prop: style.split(':')[0].trim(), value: style.split(':')[1].trim() });
                                }
                                catch(e){
                                    console.error(e.message);
                                }
                            }
                        });
                    }
                    else if(value.includes(':')) {
                        try{
							toAdd.push({ prop: value.split(':')[0].trim(), value: value.split(':')[1].trim() });
                        }
                        catch(e){
                            console.error(e.message);
                        }
                    }
                }
			}

			let toRemove = this.previousValue.style.add.filter(x => !toAdd.some(add => add.prop === x));
			
			toAdd.forEach(add => this.element.style[add.prop] = add.value);
			toRemove.forEach(remove => this.element.style.removeProperty(remove));
			
			this.previousValue.style = {
				add: toAdd.map(x => x.prop),
				remove: toRemove
			}
        }
    }

    private resolveRequired(ok: boolean) {
        if (ok)
			this.element.setAttribute('disabled', '');
        else
			this.element.removeAttribute('disabled');
    }

    public static checkSelectorMustHavePureValue(selector: string) {
        return this.selectorsMustHavePureValue.indexOf(selector.replace(/\[|\(|\]|\)/g, '')) >= 0;
    }
}