import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Task {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: number;
    dueDate?: string;
    listName?: string;
    // Time-based scheduling
    startTime?: string; // ISO 8601 format
    endTime?: string; // ISO 8601 format
    allDay?: boolean;
    durationMinutes?: number;
}

export interface CustomList {
    id?: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = `${environment.apiUrl}/tasks`;
    private listUrl = `${environment.apiUrl}/lists`;

    private tasksSubject = new BehaviorSubject<Task[]>([]);
    public tasks$ = this.tasksSubject.asObservable();
    private loaded = false;

    // Calendar cache
    private cachedCalendarTasks: Task[] = [];
    private cachedCalendarRange: string = '';

    constructor(private http: HttpClient) { }

    // Task Methods
    getAllTasks(): Observable<Task[]> {
        if (!this.loaded) {
            this.refreshTasks();
        }
        return this.tasks$;
    }

    refreshTasks() {
        this.http.get<Task[]>(this.apiUrl).subscribe({
            next: (tasks) => {
                this.tasksSubject.next(tasks);
                this.loaded = true;
            },
            error: (err) => console.error('Failed to fetch tasks', err)
        });
    }

    createTask(task: Task): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task).pipe(
            tap(newTask => {
                const currentTasks = this.tasksSubject.value;
                this.tasksSubject.next([...currentTasks, newTask]);
                this.cachedCalendarRange = ''; // Invalidate calendar cache
            })
        );
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
        return this.http.put<Task>(`${this.apiUrl}/${id}`, task).pipe(
            tap(updatedTask => {
                const currentTasks = this.tasksSubject.value;
                const index = currentTasks.findIndex(t => t.id === id);
                if (index !== -1) {
                    const updatedTasks = [...currentTasks];
                    updatedTasks[index] = updatedTask;
                    this.tasksSubject.next(updatedTasks);
                }
                this.cachedCalendarRange = ''; // Invalidate calendar cache
            })
        );
    }

    toggleComplete(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
            tap(() => {
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = currentTasks.map(t =>
                    t.id === id ? { ...t, completed: !t.completed } : t
                );
                this.tasksSubject.next(updatedTasks);
                this.cachedCalendarRange = ''; // Invalidate calendar cache
            })
        );
    }

    deleteTask(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const currentTasks = this.tasksSubject.value;
                const updatedTasks = currentTasks.filter(t => t.id !== id);
                this.tasksSubject.next(updatedTasks);
                this.cachedCalendarRange = ''; // Invalidate calendar cache
            })
        );
    }

    // Calendar-specific methods
    getTasksForCalendar(startDate: string, endDate: string): Observable<Task[]> {
        const key = `${startDate}|${endDate}`;
        if (this.cachedCalendarRange === key) {
            return of(this.cachedCalendarTasks);
        }

        return this.http.get<Task[]>(`${this.apiUrl}/calendar`, {
            params: { startDate, endDate }
        }).pipe(
            tap(tasks => {
                this.cachedCalendarTasks = tasks;
                this.cachedCalendarRange = key;
            })
        );
    }

    rescheduleTask(id: string, newStart: string, newEnd?: string): Observable<Task> {
        const params: any = { newStart };
        if (newEnd) params.newEnd = newEnd;
        return this.http.patch<Task>(`${this.apiUrl}/${id}/reschedule`, null, { params }).pipe(
            tap(() => {
                this.refreshTasks(); // Refresh main list too as times changed
                this.cachedCalendarRange = ''; // Invalidate calendar cache
            })
        );
    }
}
