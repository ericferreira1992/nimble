import { isArray, isObject } from 'util';
import { Provider } from '@nimble';

@Provider({ single: true })
export class TasksService {
    get tasks() {
        const tasks = JSON.parse(localStorage.getItem('StoredTasks'));
        return (isArray(tasks) ? tasks : []).sort((a, b) => {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });
    }
    set tasks(value) {
        if (isObject(value) && !isArray(value))
            value = [value];

        localStorage.setItem('StoredTasks', JSON.stringify(value));
    }

    get hasTasks() { return this.tasks.length > 0; }

    add(task) {
        if (task) {
            let tasks = this.tasks;
            if (!task.id)
                task.id = this.getNextId();

            tasks.push(task);
            this.tasks = tasks.sort((a, b) => {
                if (a.id < b.id) return -1;
                if (a.id > b.id) return 1;
                return 0;
            });
        }

        return task;
    }

    remove(task) {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
    }

    update(task) {
        let index = this.tasks.findIndex((t) => t.id === task.id);
        if (task) {
            let tasks = this.tasks;
            tasks[index] = task;
            this.tasks = tasks;
        }
        else
            this.add(task);
    }

    clear() {
        this.tasks = [];
    }

    getNextId() {
        let id = this.tasks.map(t => t.id)
                           .reduce((prev, curr) => ((curr > prev) ? curr : prev), 0) + 1;
        return id;
    }
}