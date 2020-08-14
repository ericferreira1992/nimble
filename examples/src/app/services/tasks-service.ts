import { Provider, HttpClient, enviroment } from '@nimble-ts/core';
import { Task } from 'src/app/models/task.model';

@Injectable({ single: true })
export class TasksService {

    private prefixUrl: string = enviroment.baseUrl;

    constructor(private http: HttpClient) {
    }

    public getTasks() {
        return this.http.get<Task[]>(`${this.prefixUrl}/tasks`);
    }

    public createTask(task: Task) {
        return this.http.post<Task>(`${this.prefixUrl}/tasks`, task);
    }

    public updateTask(task: Task) {
        return this.http.put<Task>(`${this.prefixUrl}/tasks`, task);
    }

    public removeTask(taskId: number) {
        return this.http.del(`${this.prefixUrl}/tasks/${taskId}`);
    }
}