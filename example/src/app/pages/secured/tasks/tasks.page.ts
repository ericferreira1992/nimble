import { Page, PreparePage, HttpClient, Form, DialogBuilder } from '@nimble';
import { TasksService } from '../../../services/tasks-service';
import { Helper } from '../../../services/helper-service';
import { TaskEditDialog } from './dialogs/task-edit/task-edit.dialog';

@PreparePage({
    template: require('./tasks.page.html'),
    style: require('./tasks.page.scss'),
    title: 'Tasks'
})
export default class TasksPage extends Page {

    public form: Form;
    public loadingRequest: boolean = false;

    public get tasks() { return this.taskService.tasks; }

    constructor(
        private httpClient: HttpClient,
        private taskService: TasksService,
        private dialog: DialogBuilder,
        private helper: Helper,
    ) {
        super();

        this.form = new Form({
            name: { value: '' }
        });
    }

    public addSubmit() {
        let name = this.form.get('name').value;
        if (this.taskNameIsValid()) {
            this.render(() => {
                this.taskService.add({
                    name,
                    createDate: this.helper.dateFormat(new Date())
                });
            });
        }
    }

    public toggle(task: any, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            task.done = task.done ? false : true;
            this.taskService.update(task);
        });
    }

    public remove(task: any, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            this.taskService.remove(task);
        });
    }

    public editTask(task: any) {
        // console.log(task);
        this.dialog.open(TaskEditDialog, {
            data: Object.assign({}, task),
            width: '100%',
            maxWidth: '500px'
        }).onClose.then((editedTask: any) => {
            if (editedTask)
                this.render(() => {
                    this.taskService.update(editedTask);
                });
        });
    }

    public taskNameIsValid() {
        return this.form.get('name').value && this.form.get('name').value.length >= 4;
    }
}