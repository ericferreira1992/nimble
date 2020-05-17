import { Page, PreparePage, Router, Form, Validators } from '@nimble-ts/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@PreparePage({
    template: require('./login.page.html'),
    style: require('./login.page.scss'),
    title: 'Nimble - Login'
})
export class LoginPage extends Page {

    public loading: boolean = false;
    public form: Form;

    constructor(
        private authService: AuthService
    ) {
        super();

        this.form = new Form({
            email: { validators: [Validators.required] },
            pass: { validators: [Validators.required] }
        });
    }

    public submit() {
        if (this.form.isValid) {
            this.render(() => this.loading = true);
            this.authService.login(this.form.value).then(() => {
                Router.redirect('first');
            }).catch((error) => {
                this.render(() => this.loading = false);
            });
        }
    }
}