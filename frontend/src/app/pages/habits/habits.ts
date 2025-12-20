import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HabitService, Habit, HabitStats } from '../../services/habit';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-habits',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './habits.html',
    styleUrls: ['./habits.css']
})
export class HabitsComponent implements OnInit {
    habits: Habit[] = [];
    habitEntries: Map<string, Map<string, boolean>> = new Map();

    // Calendar view
    currentMonth: Date = new Date();
    calendarDays: Date[] = [];
    weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Modal states
    isAddHabitModalOpen = false;
    isEditHabitModalOpen = false;
    selectedHabit: Habit | null = null;

    // Form data
    habitForm: Habit = {
        name: '',
        frequency: 'daily',
        targetCount: 1,
        category: 'General',
        color: '#6366f1',
        icon: '🎯'
    };

    // Available options
    categories = ['Health', 'Productivity', 'Learning', 'Fitness', 'Mindfulness', 'Social', 'General'];
    icons = ['🎯', '💪', '📚', '🏃', '🧘', '💼', '🎨', '🎵', '✍️', '🌱', '💡', '⭐', '🔥', '💎', '🚀'];
    colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
        '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
    ];

    // View mode
    viewMode: 'calendar' | 'list' = 'calendar';

    // Stats view
    showStats = false;

    constructor(
        private habitService: HabitService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadHabits();
        this.generateCalendar();
    }

    loadHabits() {
        this.habitService.getAllHabits().subscribe({
            next: (habits) => {
                this.habits = habits;
                this.loadHabitEntries();
            },
            error: (err) => console.error('Failed to load habits', err)
        });
    }

    loadHabitEntries() {
        const startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        const endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

        const startStr = this.formatDate(startDate);
        const endStr = this.formatDate(endDate);

        this.habitService.getAllHabitEntries(startStr, endStr).subscribe({
            next: (entries) => {
                this.habitEntries.clear();

                // entries is a map of habitId -> map of date -> entry
                for (const habitId in entries) {
                    const habitMap = new Map<string, boolean>();
                    const dateEntries = entries[habitId];

                    for (const date in dateEntries) {
                        habitMap.set(date, dateEntries[date].completed);
                    }

                    this.habitEntries.set(habitId, habitMap);
                }
            },
            error: (err) => console.error('Failed to load habit entries', err)
        });
    }

    generateCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        this.calendarDays = [];

        // Add days from previous month to fill the week
        const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            this.calendarDays.push(date);
        }

        // Add all days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            this.calendarDays.push(new Date(year, month, i));
        }

        // Add days from next month to complete the grid
        const remainingDays = 42 - this.calendarDays.length;
        for (let i = 1; i <= remainingDays; i++) {
            this.calendarDays.push(new Date(year, month + 1, i));
        }
    }

    previousMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.generateCalendar();
        this.loadHabitEntries();
    }

    nextMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.generateCalendar();
        this.loadHabitEntries();
    }

    isCurrentMonth(date: Date): boolean {
        return date.getMonth() === this.currentMonth.getMonth();
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isFutureDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getMonthYear(): string {
        return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    isHabitCompleted(habitId: string, date: Date): boolean {
        const dateStr = this.formatDate(date);
        const habitMap = this.habitEntries.get(habitId);
        return habitMap ? habitMap.get(dateStr) || false : false;
    }

    toggleHabit(habit: Habit, date: Date) {
        if (this.isFutureDate(date)) return;
        if (!habit.id) return;

        const dateStr = this.formatDate(date);

        this.habitService.toggleHabitEntry(habit.id, dateStr).subscribe({
            next: () => {
                // Update local state
                let habitMap = this.habitEntries.get(habit.id!);
                if (!habitMap) {
                    habitMap = new Map();
                    this.habitEntries.set(habit.id!, habitMap);
                }

                const currentState = habitMap.get(dateStr) || false;
                habitMap.set(dateStr, !currentState);

                // Reload habits to update stats
                this.loadHabits();
            },
            error: (err) => console.error('Failed to toggle habit', err)
        });
    }

    openAddHabitModal() {
        this.habitForm = {
            name: '',
            frequency: 'daily',
            targetCount: 1,
            category: 'General',
            color: '#6366f1',
            icon: '🎯'
        };
        this.isAddHabitModalOpen = true;
    }

    closeAddHabitModal() {
        this.isAddHabitModalOpen = false;
    }

    openEditHabitModal(habit: Habit) {
        this.selectedHabit = habit;
        this.habitForm = { ...habit };
        this.isEditHabitModalOpen = true;
    }

    closeEditHabitModal() {
        this.isEditHabitModalOpen = false;
        this.selectedHabit = null;
    }

    saveHabit() {
        if (!this.habitForm.name.trim()) {
            alert('Please enter a habit name');
            return;
        }

        this.habitService.createHabit(this.habitForm).subscribe({
            next: (habit) => {
                this.habits.push(habit);
                this.closeAddHabitModal();
            },
            error: (err) => {
                console.error('Failed to create habit', err);
                alert('Failed to create habit');
            }
        });
    }

    updateHabit() {
        if (!this.selectedHabit?.id) return;

        this.habitService.updateHabit(this.selectedHabit.id, this.habitForm).subscribe({
            next: (updated) => {
                const index = this.habits.findIndex(h => h.id === updated.id);
                if (index !== -1) {
                    this.habits[index] = updated;
                }
                this.closeEditHabitModal();
            },
            error: (err) => {
                console.error('Failed to update habit', err);
                alert('Failed to update habit');
            }
        });
    }

    deleteHabit(habit: Habit) {
        if (!habit.id) return;
        if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) return;

        this.habitService.deleteHabit(habit.id).subscribe({
            next: () => {
                this.habits = this.habits.filter(h => h.id !== habit.id);
            },
            error: (err) => {
                console.error('Failed to delete habit', err);
                alert('Failed to delete habit');
            }
        });
    }

    getCompletionPercentage(habit: Habit): number {
        if (!habit.id) return 0;

        const habitMap = this.habitEntries.get(habit.id);
        if (!habitMap) return 0;

        const daysInMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            0
        ).getDate();

        const today = new Date();
        const currentDay = this.currentMonth.getMonth() === today.getMonth() &&
            this.currentMonth.getFullYear() === today.getFullYear()
            ? today.getDate()
            : daysInMonth;

        let completed = 0;
        for (let i = 1; i <= currentDay; i++) {
            const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), i);
            const dateStr = this.formatDate(date);
            if (habitMap.get(dateStr)) {
                completed++;
            }
        }

        return Math.round((completed / currentDay) * 100);
    }

    goToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    logout() {
        this.authService.logout();
    }
}
