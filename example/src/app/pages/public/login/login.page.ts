import { Page, PreparePage, Form, Router } from '@nimble';
import { AuthService } from '../../../services/auth/auth.service';

@PreparePage({
    template: require('./login.page.html'),
    style: require('./login.page.scss')
})
export default class LoginPage extends Page {

    public form: Form;
    public loading: boolean = false;

    constructor(
        private authService: AuthService
    ) {
        super();

        this.form = new Form({
            user: { value: '' },
            password: { value: '' },
        });
    }

    public onSubmit() {
        if (this.validate()) {
            this.render(() => {
                this.doLogin();
            });
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

    private validate() {
        if (!this.form.get('user').value)
            return false;
        if (!this.form.get('password').value)
            return false;

        return true;
    }
}