import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Habit {
    id?: string;
    name: string;
    description?: string;
    category?: string;
    frequency: string;
    targetCount: number;
    color?: string;
    icon?: string;
    archived?: boolean;
    createdAt?: string;
    stats?: HabitStats;
}

export interface HabitStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate: number;
    completionsThisWeek: number;
    completionsThisMonth: number;
}

export interface HabitEntry {
    id?: string;
    date: string;
    completed: boolean;
    count?: number;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class HabitService {
    private apiUrl = `${environment.apiUrl}/habits`;

    constructor(private http: HttpClient) { }

    getAllHabits(): Observable<Habit[]> {
        return this.http.get<Habit[]>(this.apiUrl);
    }

    createHabit(habit: Habit): Observable<Habit> {
        return this.http.post<Habit>(this.apiUrl, habit);
    }

    updateHabit(id: string, habit: Habit): Observable<Habit> {
        return this.http.put<Habit>(`${this.apiUrl}/${id}`, habit);
    }

    deleteHabit(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    archiveHabit(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/archive`, {});
    }

    toggleHabitEntry(habitId: string, date: string): Observable<void> {
        const params = new HttpParams().set('date', date);
        return this.http.post<void>(`${this.apiUrl}/${habitId}/toggle`, {}, { params });
    }

    getHabitEntries(habitId: string, startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get(`${this.apiUrl}/${habitId}/entries`, { params });
    }

    getAllHabitEntries(startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get(`${this.apiUrl}/entries`, { params });
    }
}
