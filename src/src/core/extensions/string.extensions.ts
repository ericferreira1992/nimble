declare global {
	interface String {
		matchAll(regex: RegExp): MatchAllExecuted
	}
}
String.prototype.matchAll = function (regex: RegExp) {
    let matched = new MatchAllExecuted(this);
    let initialInput = this as string;
    let executed = regex.exec(initialInput);
    
    while (executed) {
        matched.executeds.push({ value: executed });
        initialInput = initialInput.replace(matched[0], '');
        executed = regex.exec(initialInput);
    }

	return matched;
}

export class MatchAllExecuted {
    executeds: { value: string[] }[] = [];
    input: string;

    constructor(input: string) {
        this.input = input;
    }
    
    public next(): { value: string[] } {
        let next = null;
        if (this.executeds.length > 0) {
            next = this.executeds[0];
            this.executeds = this.executeds.slice(1);
        }
        return next;
    }
}