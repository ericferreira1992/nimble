import { Dialog, PrepareDialog, Inject, DIALOG_REF, DialogRef, Form } from "@nimble";

@PrepareDialog({
    template: require('./task-edit.dialog.html'),
    style: require('./task-edit.dialog.scss')
})
export class TaskEditDialog extends Dialog {

    public task: any;
    public form: Form;

    constructor(
        @Inject(DIALOG_REF) public dialogRef: DialogRef<TaskEditDialog>
    ) {
        super();
        this.task = this.dialogRef.data;
        this.makeForm();
    }

    private makeForm() {
        this.form = new Form({
            name: { value: this.task.name }
        });

        this.form.fields.name.valueChanges.subscribe((value) => {
            this.render(() => this.task.name = value);
        });
    }

    public onSubmit() {
        if (this.isFormValid()) {
            this.save();
        }
    }

    public isFormValid() {
        return this.form.fields.name.value !== '';
    }

    public save() {
        this.task.name = this.form.fields.name.value;
        this.dialogRef.close(this.task);
    }

    public onOpen() {
        console.log('DIALOG OPENED');
    }

    public onClose() {
        console.log('DIALOG CLOSED');
    }
}