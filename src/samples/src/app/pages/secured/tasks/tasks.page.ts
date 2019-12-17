import { Page, PreparePage, Form, DialogBuilder, HttpResponse, Validators } from '@nimble';
import { TasksService } from '../../../services/tasks-service';
import { Helper } from '../../../services/helper-service';
import { TaskEditDialog } from './dialogs/task-edit/task-edit.dialog';
import { Task } from '../../../models/task.model';

@PreparePage({
    template: require('./tasks.page.html'),
    style: require('./tasks.page.scss'),
    title: 'Tasks'
})
export default class TasksPage extends Page {

    public loadingTasks: boolean = true;
    public form: Form;
    public tasks: Task[] = [];

    constructor(
        private taskService: TasksService,
        private dialog: DialogBuilder,
        private helper: Helper,
    ) {
        super();
        this.makeForm();
        this.getTasks();
    }

    private makeForm() {
        this.form = new Form({
            name: { value: '', validators: [ Validators.required ] }
        });
        this.form.validate();
    }

    public getTasks() {
        this.render(() => {
            this.loadingTasks = true;
            this.taskService.getTasks().then(
                (response: HttpResponse<Task[]>) => {
                    this.tasks = response.data;
                    this.loadingTasks = false;
                    this.render();
                },
                (error) => {
                    this.loadingTasks = false;
                    this.render();
                }
            );
        });
    }

    public onSubmit() {
        if (this.form.isValid) {
            this.loadingTasks = true;
            this.taskService.createTask(this.form.value).then(
                (response: HttpResponse<Task>) => {
                    this.render(() => {
                        this.tasks.push(response.data);
                        this.form.reset();
                        this.form.validate();
                        this.loadingTasks = false;
                    });
                },
                (error) => {
                    this.render(() => {
                        this.loadingTasks = false;
                    });
                }
            );
        }
    }

    public toggle(task: Task, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            this.loadingTasks = true;
            task.done = task.done ? false : true;
            this.taskService.updateTask(task).then(
                (response: HttpResponse<Task>) => {
                    this.loadingTasks = false;
                    this.render();
                },
                (error) => {
                    task.done = !task.done;
                    this.loadingTasks = false;
                    this.render();
                }
            );
        });
    }

    public remove(task: Task, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            this.loadingTasks = true;
            this.taskService.removeTask(task.id).then(
                () => {
                    this.loadingTasks = false;
                    this.tasks = this.tasks.filter(x => x !== task);
                    this.render();
                },
                (error) => {
                    this.loadingTasks = false;
                    this.render();
                }
            );
        });
    }

    public editTask(task: Task) {
        this.dialog.open(TaskEditDialog, {
            data: { task },
            width: '100%',
            maxWidth: '500px'
        }).onClose.then((editedTask: Task) => {
            if (editedTask)
                this.render(() => {
                    this.loadingTasks = true;
                    this.taskService.updateTask(editedTask).then(
                        () => this.getTasks(),
                        (error) => {
                            this.loadingTasks = false;
                            this.render();
                        }
                    );
                });
        });
    }
}