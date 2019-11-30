export class DiffDOM {
    constructor(){}

    public diff(target: HTMLElement, source: HTMLElement): HTMLElement {
        if (source && target) {
            if (target.tagName === source.tagName) {
                this.diffAttributes(target, source);
                if (target.childNodes.length || source.childNodes.length) {
                    this.diffChildren(target, source);
                }
                return target;
            }
            else {
                target.insertAdjacentElement('afterend', source);
                target.parentElement.removeChild(target);
                return source;
            }
        }
    }

    private diffElement(target: HTMLElement, source: HTMLElement){
        if (target.tagName === source.tagName) {
            this.diffAttributes(target, source);
            if (target.childNodes.length || source.childNodes.length) {
                this.diffChildren(target, source);
            }
        }
        else
            console.warn(target, source, 'Differents!');
    }

    private diffChildren(target: HTMLElement, source: HTMLElement){
        let targetNodes: ChildNode[] = [];
        let sourceNodes: ChildNode[] = [];

        for(var i = 0; i < target.childNodes.length; i++){
            let child = target.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE && !(child.textContent.trim())) {
                target.removeChild(child);
                i--;
                continue;
            }
            if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE)
                targetNodes.push(child);
        }

        for(var i = 0; i < source.childNodes.length; i++) {
            let child = source.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE && !(child.textContent.trim())) {
                source.removeChild(child);
                i--;
                continue;
            }
            if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE)
                sourceNodes.push(child);
        }
        
        let sourceElements = sourceNodes.filter(y => y.nodeType === Node.ELEMENT_NODE) as HTMLElement[];

        let notExistsInTarget = targetNodes.filter(x => {
            if (x.nodeType === Node.ELEMENT_NODE) {
                return !sourceElements.some(y => y.tagName === (x as HTMLElement).tagName);
            }
            return false;
        });

        if(notExistsInTarget.length > 0) {
            for(var i = 0; i < target.childNodes.length; i++){
                let child = target.childNodes[i];
                if (notExistsInTarget.some(x => x === child)) {
                    target.removeChild(child);
                    i--;
                }
            }
            targetNodes = targetNodes.filter(x => !notExistsInTarget.some(y => y === x));
        }

        let length = Math.max(sourceNodes.length, targetNodes.length);
        for(var i = 0; i < length; i++) {
            let sourceChild = i < sourceNodes.length ? sourceNodes[i] : null;
            let targetChild = i < targetNodes.length ? targetNodes[i] : null;
            
            if (targetChild && sourceChild) {
                if (sourceChild.nodeType === targetChild.nodeType) {
                    if (sourceChild.nodeType === Node.ELEMENT_NODE && targetChild.nodeType === Node.ELEMENT_NODE) {
                        if ((sourceChild as HTMLElement).tagName === (targetChild as HTMLElement).tagName){
                            this.diffElement((targetChild as HTMLElement), (sourceChild as HTMLElement));
                            continue;
                        }
                    }
                    else if (sourceChild.nodeType === Node.TEXT_NODE && targetChild.nodeType === Node.TEXT_NODE) {
                        targetChild.textContent = sourceChild.textContent;
                        continue;
                    }
                }
                (targetChild as HTMLElement).parentElement.insertBefore(sourceChild, targetChild);
                if (i === (length - 1))
                    target.removeChild(targetChild);
            }
            else if (sourceChild) {
                target.append(sourceChild);
            }
            else {
                target.removeChild(targetChild);
            }
        }
    }

    private diffAttributes(target: HTMLElement, source: HTMLElement){
        let targetAttr: Attr[] = [];
        let sourceAttr: Attr[] = [];

        for(var i = 0; i < target.attributes.length; i++)
            targetAttr.push(target.attributes[i]);

        for(var i = 0; i < source.attributes.length; i++)
            sourceAttr.push(source.attributes[i]);

        let diff = {
            new: sourceAttr.filter(x => !targetAttr.some(y => y.name === x.name )),
            old: targetAttr.filter(x => !sourceAttr.some(y => y.name === x.name )),
            same: sourceAttr.filter(x => targetAttr.some(y => y.name === x.name )),
        }

        for(let attr of diff.old)
            target.removeAttribute(attr.name);
        for(let attr of diff.new)
            target.setAttribute(attr.name, attr.value);
        for(let attr of diff.same.filter(x => x.value !== target.attributes[x.name].value)){
            if (attr.name === 'class' && attr.value) {
                let sourceClasses = source.classList.value.split(' ');
                let targetClasses = target.classList.value ? target.classList.value.split(' ') : [];
                
                for(let c of sourceClasses.filter(x => !targetClasses.some(y => y === x )))
                    target.classList.add(c);
                for(let c of targetClasses.filter(x => !sourceClasses.some(y => y === x )))
                    target.classList.remove(c);
            }
            else
                target.attributes[attr.name].value = attr.value;
        }

    }
}