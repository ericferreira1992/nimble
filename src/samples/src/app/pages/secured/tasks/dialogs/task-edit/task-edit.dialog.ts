import { Dialog, PrepareDialog, Inject, DIALOG_REF, DialogRef, Form, Validators } from "@nimble";

@PrepareDialog({
    template: require('./task-edit.dialog.html'),
    style: require('./task-edit.dialog.scss')
})
export class TaskEditDialog extends Dialog {

    public task: any;
    public form: Form;

    public types = [
        { text: 'Teste 01', value: 'T1' },
        { text: 'Teste 02', value: 'T2' },
        { text: 'Teste 03', value: 'T3' },
    ];

    constructor(
        @Inject(DIALOG_REF) public dialogRef: DialogRef<TaskEditDialog>
    ) {
        super();
        this.task = Object.assign({}, this.dialogRef.data.task);
        this.makeForm();
    }

    private makeForm() {
        this.form = new Form({
            name: { value: this.task.name, validators: [ Validators.required ] },
            type: { value: this.task.type, validators: [ Validators.required ] },
            done: { value: this.task.done ? true : false, validators: [ Validators.required ] },
            checklist: { value: this.task.checklist, validators: [ Validators.required ] },
            date: { value: this.task.date, validators: [ Validators.required ] },
            order: { value: this.task.order, validators: [ Validators.required ] },
            teste: { value: this.task.teste, validators: [ Validators.required ] },
            email: { value: this.task.email, validators: [ Validators.required, Validators.email ] },
        });
    }

    public onNameChanged(value) {
        this.render(() => this.task.name = value);
    }

    public onSubmit() {
        this.render(() => {
            for(let field in this.form.fields) {
                console.log(field, this.form.fields[field].errors);
            }

            if (this.form.isValid) {
                this.save();
            }
        });
    }

    public isFormValid() {
        return this.form.get('name').value !== '';
    }

    public save() {
        Object.assign(this.task, this.form.value);
        this.dialogRef.close(this.task);
    }
}