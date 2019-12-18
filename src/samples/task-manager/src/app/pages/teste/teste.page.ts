import { Page, PreparePage } from '@nimble';

@PreparePage({
    template: require('./teste.page.html'),
    style: require('./teste.page.scss')
})
export default class TestePage extends Page {

    public option1: boolean = true;

    public options: string[] = [
        'Teste1'
    ];

    constructor(
    ) {
        super();
    }

    public teste() {
        if (this.options.length > 2) {
            this.render(() => {
                this.options[Math.floor(this.options.length / 2)] = 'AAAAAA';
            });
        }
    }

    public add() {
        this.render(() => {
            this.options.push('Teste' + (this.options.length + 1));
        });
    }
    public remove(index) {
        this.render(() => {
            this.options = this.options.filter((o, i) => i !== index);
        });
    }

    public toggle() {
        this.render(() => {
            this.option1 = !this.option1;
        });
    }
}