export class DiffDOM {
    constructor(){}

    public diff(target: HTMLElement, source: HTMLElement, changedFn: (oldElement: HTMLElement, newElement: HTMLElement) => void, elementFromIterate: (element: HTMLElement) => boolean): HTMLElement {
        if (source && target) {
            if (target.tagName === source.tagName) {
                this.diffAttributes(target, source);
                if (target.childNodes.length || source.childNodes.length) {
                    this.diffChildren(target, source, changedFn);
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

    private diffChildren(target: HTMLElement, source: HTMLElement, changedFn: (oldElement: HTMLElement, newElement: HTMLElement) => void){
        let targetNodes = this.getNodesCanBeDiffedOfParent(target);
        let sourceNodes = this.getNodesCanBeDiffedOfParent(source);

        let notExistsInTarget = this.removeNodesNotExistsInTarget(target, targetNodes, sourceNodes);
        targetNodes = targetNodes.filter(x => !notExistsInTarget.some(y => y === x));

        // if (target.className.includes('animated slideInDown')) {
        //     debugger;
        // }

        let length = Math.max(sourceNodes.length, targetNodes.length);
        for(var i = 0; i < length; i++) {
            let sourceChild: ChildNode = i < sourceNodes.length ? sourceNodes[i] : null;
            let targetChild: ChildNode = i < targetNodes.length ? targetNodes[i] : null;

            // if (targetChild && targetChild.nodeType === Node.ELEMENT_NODE && (targetChild as HTMLElement).className.includes('loading-spinner')) {
            //     debugger;
            // }
            
            if (targetChild && sourceChild) {

                if (sourceChild.nodeType === targetChild.nodeType) {
                    if (sourceChild.nodeType === Node.ELEMENT_NODE && targetChild.nodeType === Node.ELEMENT_NODE) {
                        if ((sourceChild as HTMLElement).tagName === (targetChild as HTMLElement).tagName){
                            this.diffElement((targetChild as HTMLElement), (sourceChild as HTMLElement), changedFn);
                            continue;
                        }
                    }
                    else if (sourceChild.nodeType === Node.TEXT_NODE && targetChild.nodeType === Node.TEXT_NODE) {
                        if (targetChild.textContent.trim() !== sourceChild.textContent.trim()) {
                            targetChild.textContent = sourceChild.textContent;
                        }
                        continue;
                    }
                }

                // if (sourceChild.nodeType === Node.ELEMENT_NODE || sourceChild.textContent) {
                    (targetChild as HTMLElement).parentElement.insertBefore(sourceChild, targetChild);
                    targetNodes.splice(i, 0, sourceChild);
                // }
                
                if (i === (length - 1))
                    target.removeChild(targetChild);
            }
            else if (sourceChild)
                target.append(sourceChild);
            else if (targetChild.nodeType !== Node.TEXT_NODE && targetChild.textContent.trim() !== '')
                target.removeChild(targetChild);
        }
    }

    private diffElement(target: HTMLElement, source: HTMLElement, changedFn: (oldElement: HTMLElement, newElement: HTMLElement) => void){
        if (target.tagName === source.tagName) {
            this.diffAttributes(target, source);
            if (target.childNodes.length || source.childNodes.length) {
                this.diffChildren(target, source, changedFn);
            }
            changedFn(source, target);
        }
        else
            console.warn(target, source, 'Differents!');
    }

    private getNodesCanBeDiffedOfParent(element: HTMLElement): ChildNode[] {
        let nodes: ChildNode[] = [];
        for(var i = 0; i < element.childNodes.length; i++){
            let child = element.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE && !(child.textContent)) {
                element.removeChild(child);
                i--;
                continue;
            }
            if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE)
                nodes.push(child);
        }
        return nodes;
    }

    private removeNodesNotExistsInTarget(targetParent: HTMLElement, targetNodes: ChildNode[], sourceNodes: ChildNode[]): ChildNode[] {

        let notExistsInTarget = targetNodes.filter(x => {
            if (x.nodeType === Node.ELEMENT_NODE) {
                return !sourceNodes.filter(y => y.nodeType === Node.ELEMENT_NODE).some(y => (y as HTMLElement).tagName === (x as HTMLElement).tagName);
            }
            if (x.nodeType === Node.TEXT_NODE) {
                return !sourceNodes.filter(y => y.nodeType === Node.TEXT_NODE).some(y => y.textContent.trim() === x.textContent.trim());//.some(y => y.textContent === x.textContent);
            }
            return true;
        });

        if(notExistsInTarget.length > 0) {
            for(var i = 0; i < targetParent.childNodes.length; i++){
                let child = targetParent.childNodes[i];
                if (notExistsInTarget.some(x => x === child) && child.parentNode === targetParent) {
                    try {
                        targetParent.removeChild(child);
                        i--;
                    }
                    catch(e) {
                    }
                }
            }
        }

        return notExistsInTarget;
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