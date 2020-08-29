import { Page, PreparePage } from '@nimble-ts/core/page';
import { Form, Validators } from '@nimble-ts/core/forms';
import { Router } from '@nimble-ts/core/route';
import { RouteParams } from '@nimble-ts/core/providers/route-params';
import { AuthService } from 'src/app/services/auth/auth.service';

@PreparePage({
    template: require('./login.page.html'),
    style: require('./login.page.scss'),
    title: 'Login'
})
export class LoginPage extends Page {

    public form: Form;
    public loading: boolean = false;

    constructor(
        private authService: AuthService,
        private routeParams: RouteParams
    ) {
        super();

        this.form = new Form({
            user: { value: 'teste', validators: [ Validators.required ] },
            password: { value: 'teste', validators: [ Validators.required ] },
        });

        console.log(this.routeParams);
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
        );;
    }
}