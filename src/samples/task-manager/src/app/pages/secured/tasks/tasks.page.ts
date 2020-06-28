import { Page, PreparePage, Form, DialogBuilder, HttpResponse, Validators } from '@nimble-ts/core';
import { TasksService } from 'src/app/services/tasks-service';
import { Helper } from 'src/app/services/helper-service';
import { TaskEditDialog } from './dialogs/task-edit/task-edit.dialog';
import { Task } from 'src/app/models/task.model';

@PreparePage({
    template: require('./tasks.page.html'),
    style: require('./tasks.page.scss'),
    title: 'Tasks'
})
export class TasksPage extends Page {

    public loadingTasks: boolean = true;
    public toggleLoading: boolean = false;
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
        this.render(() => this.loadingTasks = true);
        this.taskService.getTasks().then(
            (response: HttpResponse<Task[]>) => {
                this.tasks = response.data;
            },
            (error) => {
                console.log(error);
            }
        ).finally(() => {
            this.render(() => this.loadingTasks = false);
        });
    }

    public onSubmit() {
        if (this.form.isValid) {
            this.loadingTasks = true;
            this.taskService.createTask(this.form.value).then(
                (response: HttpResponse<Task>) => {
                    this.tasks.push(response.data);
                    this.form
                        .reset()
                        .validate();
                },
                (error) => {
                    console.log(error);
                }
            ).finally(() => {
                this.render(() => this.loadingTasks = false);
            });
        }
    }

    public toggle(task: Task, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            task.loading = true;
            task.done = task.done ? false : true;
            this.taskService.updateTask(task).then(
                (response: HttpResponse<Task>) => {
                },
                (error) => {
                    task.done = !task.done;
                    console.log(error);
                }
            ).finally(() => {
                this.render(() => task.loading = false);
            });
        });
    }

    public remove(task: Task, event: MouseEvent) {
        event.stopImmediatePropagation();
        this.render(() => {
            this.loadingTasks = true;
            this.taskService.removeTask(task.id).then(
                (response) => {
                    this.render(() => {
                        this.loadingTasks = false;
                        this.tasks = response.data;
                    });
                },
                (error) => {
                    this.render(() => {
                        this.loadingTasks = false;
                    });
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