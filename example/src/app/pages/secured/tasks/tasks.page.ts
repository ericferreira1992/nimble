import { Page, PreparePage, HttpClient, Form } from '@nimble';
import { TasksService } from '../../../services/tasks-service';
import { Helper } from '../../../services/helper-service';

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

    public toggle(task: any) {
        this.render(() => {
            task.done = task.done ? false : true;
            this.taskService.update(task);
        });
    }

    public remove(task: any) {
        this.render(() => {
            this.taskService.remove(task);
        });
    }

    public taskNameIsValid() {
        return this.form.get('name').value && this.form.get('name').value.length >= 4;
    }
}