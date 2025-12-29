import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
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

    private habitsSubject = new BehaviorSubject<Habit[]>([]);
    public habits$ = this.habitsSubject.asObservable();
    private loaded = false;

    // Cache for entries grid
    private cachedEntries: any = null;
    private cachedRange: string = '';

    constructor(private http: HttpClient) { }

    getAllHabits(): Observable<Habit[]> {
        if (!this.loaded) {
            this.refreshHabits();
        }
        return this.habits$;
    }

    refreshHabits() {
        this.http.get<Habit[]>(this.apiUrl).subscribe({
            next: (habits) => {
                this.habitsSubject.next(habits);
                this.loaded = true;
            },
            error: (err) => console.error('Failed to fetch habits', err)
        });
    }

    createHabit(habit: Habit): Observable<Habit> {
        return this.http.post<Habit>(this.apiUrl, habit).pipe(
            tap(newHabit => {
                const current = this.habitsSubject.value;
                this.habitsSubject.next([...current, newHabit]);
            })
        );
    }

    updateHabit(id: string, habit: Habit): Observable<Habit> {
        return this.http.put<Habit>(`${this.apiUrl}/${id}`, habit).pipe(
            tap(updatedHabit => {
                const current = this.habitsSubject.value;
                const index = current.findIndex(h => h.id === id);
                if (index !== -1) {
                    const updated = [...current];
                    updated[index] = updatedHabit;
                    this.habitsSubject.next(updated);
                }
            })
        );
    }

    deleteHabit(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                const current = this.habitsSubject.value;
                this.habitsSubject.next(current.filter(h => h.id !== id));
            })
        );
    }

    archiveHabit(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/archive`, {}).pipe(
            tap(() => {
                const current = this.habitsSubject.value;
                const index = current.findIndex(h => h.id === id);
                if (index !== -1) {
                    const updated = [...current];
                    updated[index] = { ...updated[index], archived: true };
                    this.habitsSubject.next(updated);
                }
            })
        );
    }

    toggleHabitEntry(habitId: string, date: string): Observable<void> {
        const params = new HttpParams().set('date', date);
        return this.http.post<void>(`${this.apiUrl}/${habitId}/toggle`, {}, { params }).pipe(
            tap(() => {
                // Update local entries cache if it exists and contains this date
                if (this.cachedEntries && this.cachedEntries[habitId] && this.cachedEntries[habitId][date]) {
                    this.cachedEntries[habitId][date].completed = !this.cachedEntries[habitId][date].completed;
                } else if (this.cachedEntries && this.cachedEntries[habitId]) {
                    // Entry might not exist yet in cache (first toggle), so assume it became true
                    this.cachedEntries[habitId][date] = { completed: true, date: date };
                }

                // Refresh main list for stats
                this.refreshHabits();
            })
        );
    }

    getHabitEntries(habitId: string, startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get(`${this.apiUrl}/${habitId}/entries`, { params });
    }

    getAllHabitEntries(startDate: string, endDate: string): Observable<any> {
        const key = `${startDate}|${endDate}`;
        if (this.cachedRange === key && this.cachedEntries) {
            return of(this.cachedEntries);
        }

        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        return this.http.get(`${this.apiUrl}/entries`, { params }).pipe(
            tap(res => {
                this.cachedEntries = res;
                this.cachedRange = key;
            })
        );
    }
}
