import { Page, PreparePage, Form, Router, Validators } from '@nimble';
import { AuthService } from '../../../services/auth/auth.service';

@PreparePage({
    template: require('./login.page.html'),
    style: require('./login.page.scss'),
    title: 'Login'
})
export default class LoginPage extends Page {

    public form: Form;
    public loading: boolean = false;

    constructor(
        private authService: AuthService,
    ) {
        super();

        this.form = new Form({
            user: { value: '', validators: [ Validators.required ] },
            password: { value: '', validators: [ Validators.required ] },
        });
    }

    public onSubmit() {
        if (this.form.isValid) {
            this.doLogin();
        }
    }

    public doLogin() {
        this.loading = true;
        this.authService.login(this.form.value).then(
            () => {
                Router.redirect('/tasks');
            },
            () => {
                this.loading = false;
                this.render();
            }
        );
    }
}