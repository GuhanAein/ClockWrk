import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: number;
    dueDate?: string;
    listName?: string;
}

export interface CustomList {
    id?: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = 'http://localhost:8080/api/tasks';
    private listUrl = 'http://localhost:8080/api/lists';

    constructor(private http: HttpClient) { }

    // Task Methods
    getAllTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl);
    }

    createTask(task: Task): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task);
    }

    // List Methods
    getLists(): Observable<CustomList[]> {
        return this.http.get<CustomList[]>(this.listUrl);
    }

    createList(name: string): Observable<CustomList> {
        return this.http.post<CustomList>(this.listUrl, { name });
    }

    deleteList(id: string): Observable<void> {
        return this.http.delete<void>(`${this.listUrl}/${id}`);
    }

    updateTask(id: string, task: Task): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
    }

    toggleComplete(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/toggle`, {});
    }

    deleteTask(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
