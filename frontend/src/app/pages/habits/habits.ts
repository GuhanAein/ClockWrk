import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HabitService, Habit, HabitStats } from '../../services/habit';
import { AuthService, UserProfile } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { AppHeaderComponent } from '../../components/app-header/app-header';
import confetti from 'canvas-confetti';

@Component({
    selector: 'app-habits',
    standalone: true,
    imports: [CommonModule, FormsModule, AppHeaderComponent],
    templateUrl: './habits.html',
    styleUrls: ['./habits.css']
})
export class HabitsComponent implements OnInit {
    // User info for header
    username = 'User';
    userAvatarUrl = '';
    sidebarOpen = true;
    habits: Habit[] = [];
    habitEntries: Map<string, Map<string, boolean>> = new Map();

    // Sheet View
    currentMonth: Date = new Date();
    monthDays: Date[] = [];
    weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Filtering & Sorting
    filterCategory: string = 'All';
    sortBy: 'name' | 'streak' | 'completion' = 'name';

    // View state
    activeView: 'grid' | 'table' | 'heatmap' = 'table';
    sheetPeriod: 'day' | 'week' | 'month' = 'week';
    currentDate: Date = new Date();

    // Streak tracking
    overallStreak = 0;
    bestStreak = 0;

    // Modal states
    isAddHabitModalOpen = false;
    isEditHabitModalOpen = false;
    selectedHabit: Habit | null = null;

    // Form data
    habitForm: any = {
        name: '',
        frequency: 'daily',
        targetCount: 1,
        category: 'General',
        color: '#6366f1',
        icon: '🎯',
        reminderTime: ''
    };

    // Available options
    categories = ['Health', 'Productivity', 'Learning', 'Fitness', 'Mindfulness', 'Social', 'General'];
    icons = ['🎯', '💪', '📚', '🏃', '🧘', '💼', '🎨', '🎵', '✍️', '🌱', '💡', '⭐', '🔥', '💎', '🚀', '🧠', '💤', '🥗', '💧', '🎮'];
    colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
        '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
    ];

    constructor(
        private habitService: HabitService,
        private authService: AuthService,
        private notification: NotificationService,
        private router: Router
    ) { }


    // View State
    viewMode: 'monthly' | 'weekly' = 'weekly';

    // Weekly Stats
    weeklySummary = {
        grade: 0,
        gradeLetter: 'F',
        perfectDays: 0,
        completedCount: 0,
        totalDue: 0
    };

    currentWeekStart: Date = new Date();
    weekDates: Date[] = [];

    get displayedDays(): Date[] {
        switch (this.sheetPeriod) {
            case 'day':
                return [this.currentDate];
            case 'week':
                return this.weekDates;
            case 'month':
                return this.monthDays;
            default:
                return this.weekDates;
        }
    }

    setViewMode(mode: 'weekly' | 'monthly') {
        this.viewMode = mode;
        this.loadHabitEntries();
    }

    get filteredHabits(): Habit[] {
        let result = [...this.habits];

        if (this.filterCategory !== 'All') {
            result = result.filter(h => h.category === this.filterCategory);
        }

        result.sort((a, b) => {
            if (this.sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            if (this.sortBy === 'streak') {
                return (b.stats?.currentStreak || 0) - (a.stats?.currentStreak || 0);
            }
            if (this.sortBy === 'completion') {
                return this.getMonthlySuccessPercentage(b) - this.getMonthlySuccessPercentage(a);
            }
            return 0;
        });

        return result;
    }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        // Load user profile for header
        this.authService.getProfile().subscribe({
            next: (user: UserProfile) => {
                this.username = user.name || 'User';
                this.userAvatarUrl = user.profilePictureUrl || '';
            },
            error: () => {}
        });

        this.generateMonthDays();
        this.generatecurrentWeekDates();
        this.loadHabits();
        this.loadHabitEntries();
    }

    openSettingsModal() {
        // Navigate to dashboard settings - could be improved with a dedicated settings page
        this.router.navigate(['/app'], { queryParams: { openSettings: true } });
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    setSheetPeriod(period: 'day' | 'week' | 'month') {
        this.sheetPeriod = period;
        this.currentDate = new Date();
        this.generatecurrentWeekDates();
        this.generateMonthDays();
        this.loadHabitEntries();
    }

    navigatePrevious() {
        switch (this.sheetPeriod) {
            case 'day':
                this.currentDate = new Date(this.currentDate);
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'week':
                this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
                this.generateWeekDatesFromStart();
                break;
            case 'month':
                this.previousMonth();
                return; // previousMonth already loads entries
        }
        this.loadHabitEntries();
    }

    navigateNext() {
        switch (this.sheetPeriod) {
            case 'day':
                this.currentDate = new Date(this.currentDate);
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'week':
                this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
                this.generateWeekDatesFromStart();
                break;
            case 'month':
                this.nextMonth();
                return; // nextMonth already loads entries
        }
        this.loadHabitEntries();
    }

    goToToday() {
        this.currentDate = new Date();
        this.currentMonth = new Date();
        this.generatecurrentWeekDates();
        this.generateMonthDays();
        this.loadHabitEntries();
    }

    generateWeekDatesFromStart() {
        this.weekDates = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(this.currentWeekStart);
            next.setDate(this.currentWeekStart.getDate() + i);
            this.weekDates.push(next);
        }
    }

    getDateRangeLabel(): string {
        switch (this.sheetPeriod) {
            case 'day':
                return this.currentDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            case 'week':
                const weekStart = this.weekDates[0];
                const weekEnd = this.weekDates[6];
                if (weekStart.getMonth() === weekEnd.getMonth()) {
                    return `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
                }
                return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'month':
                return this.getMonthYear();
            default:
                return '';
        }
    }

    generatecurrentWeekDates() {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay();

        this.currentWeekStart = new Date(curr.setDate(first));
        this.weekDates = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(this.currentWeekStart);
            next.setDate(this.currentWeekStart.getDate() + i);
            this.weekDates.push(next);
        }
    }

    calculateWeeklySummary() {
        let totalOpportunities = 0;
        let totalCompleted = 0;
        let perfectDaysCount = 0;

        this.weekDates.forEach(date => {
            if (this.isFutureDate(date)) return;

            let dayOpportunities = 0;
            let dayCompleted = 0;

            this.habits.forEach(habit => {
                if (habit.archived) return;

                if (habit.frequency === 'daily') {
                    dayOpportunities++;
                    if (this.isHabitCompleted(habit.id!, date)) {
                        dayCompleted++;
                    }
                }
            });

            totalOpportunities += dayOpportunities;
            totalCompleted += dayCompleted;

            if (dayOpportunities > 0 && dayCompleted === dayOpportunities) {
                perfectDaysCount++;
            }
        });

        this.habits.filter(h => h.frequency === 'weekly').forEach(habit => {
            totalOpportunities += habit.targetCount;
            let doneThisWeek = 0;
            this.weekDates.forEach(d => {
                if (this.isHabitCompleted(habit.id!, d)) doneThisWeek++;
            });
            totalCompleted += Math.min(doneThisWeek, habit.targetCount);
        });

        this.weeklySummary.completedCount = totalCompleted;
        this.weeklySummary.totalDue = totalOpportunities;
        this.weeklySummary.perfectDays = perfectDaysCount;

        const percentage = totalOpportunities > 0 ? (totalCompleted / totalOpportunities) * 100 : 0;
        this.weeklySummary.grade = Math.round(percentage);

        if (percentage >= 97) this.weeklySummary.gradeLetter = 'A+';
        else if (percentage >= 93) this.weeklySummary.gradeLetter = 'A';
        else if (percentage >= 90) this.weeklySummary.gradeLetter = 'A-';
        else if (percentage >= 87) this.weeklySummary.gradeLetter = 'B+';
        else if (percentage >= 83) this.weeklySummary.gradeLetter = 'B';
        else if (percentage >= 80) this.weeklySummary.gradeLetter = 'B-';
        else if (percentage >= 77) this.weeklySummary.gradeLetter = 'C+';
        else if (percentage >= 73) this.weeklySummary.gradeLetter = 'C';
        else if (percentage >= 70) this.weeklySummary.gradeLetter = 'C-';
        else if (percentage >= 60) this.weeklySummary.gradeLetter = 'D';
        else this.weeklySummary.gradeLetter = 'F';
    }

    loadHabits() {
        this.habitService.getAllHabits().subscribe({
            next: (habits) => {
                this.habits = habits;
                this.loadHabitEntries();
                this.calculateWeeklySummary();
                this.calculateOverallStreak();
            },
            error: () => this.notification.error('Failed to load habits')
        });
    }

    loadHabitEntries() {
        let startDate: Date;
        let endDate: Date;

        switch (this.sheetPeriod) {
            case 'day':
                startDate = new Date(this.currentDate);
                endDate = new Date(this.currentDate);
                break;
            case 'week':
            startDate = new Date(this.weekDates[0]);
            endDate = new Date(this.weekDates[this.weekDates.length - 1]);
                break;
            case 'month':
            default:
            const year = this.currentMonth.getFullYear();
            const month = this.currentMonth.getMonth();
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month + 1, 0);
                break;
        }

        const startStr = this.formatDate(startDate);
        const endStr = this.formatDate(endDate);

        this.habitService.getAllHabitEntries(startStr, endStr).subscribe({
            next: (entries) => {
                this.habitEntries.clear();

                for (const habitId in entries) {
                    const habitMap = new Map<string, boolean>();
                    const dateEntries = entries[habitId];

                    for (const date in dateEntries) {
                        habitMap.set(date, dateEntries[date].completed);
                    }

                    this.habitEntries.set(habitId, habitMap);
                }

                    this.calculateWeeklySummary();
            },
            error: () => this.notification.error('Failed to load habit entries')
        });
    }

    generateMonthDays() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        this.monthDays = [];
        for (let i = 1; i <= lastDay; i++) {
            this.monthDays.push(new Date(year, month, i));
        }
    }

    previousMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.generateMonthDays();
        this.loadHabitEntries();
    }

    nextMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.generateMonthDays();
        this.loadHabitEntries();
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isFutureDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        return compareDate > today;
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

    toggleHabit(habit: Habit, date: Date, event?: MouseEvent) {
        if (this.isFutureDate(date)) return;
        if (!habit.id) return;

        const dateStr = this.formatDate(date);
        const isCurrentlyCompleted = this.isHabitCompleted(habit.id, date);

        this.habitService.toggleHabitEntry(habit.id, dateStr).subscribe({
            next: () => {
                let habitMap = this.habitEntries.get(habit.id!);
                if (!habitMap) {
                    habitMap = new Map();
                    this.habitEntries.set(habit.id!, habitMap);
                }

                habitMap.set(dateStr, !isCurrentlyCompleted);
                this.loadHabits();

                if (!isCurrentlyCompleted && event) {
                    this.triggerConfetti(event);
                }
            },
            error: () => this.notification.error('Failed to update habit')
        });
    }

    triggerConfetti(event: MouseEvent) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 40,
            spread: 60,
            origin: { x, y },
            colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
            disableForReducedMotion: true,
            zIndex: 10000,
        });
    }

    getMonthlyResult(habit: Habit): string {
        if (!habit.id) return '0/' + this.monthDays.length;

        const habitMap = this.habitEntries.get(habit.id);
        if (!habitMap) return '0/' + this.monthDays.length;

        let completed = 0;
        this.monthDays.forEach(day => {
            if (habitMap.get(this.formatDate(day))) completed++;
        });

        return `${completed}/${this.monthDays.length}`;
    }

    getMonthlySuccessPercentage(habit: Habit): number {
        if (!habit.id) return 0;

        const today = new Date();
        const isCurrentMonth = this.currentMonth.getMonth() === today.getMonth() &&
            this.currentMonth.getFullYear() === today.getFullYear();

        let daysPassed = this.monthDays.length;
        if (isCurrentMonth) {
            daysPassed = today.getDate();
        } else if (this.currentMonth > today) {
            return 0;
        }

        const habitMap = this.habitEntries.get(habit.id);
        if (!habitMap || daysPassed === 0) return 0;

        let completed = 0;
        for (let i = 0; i < daysPassed; i++) {
            if (i < this.monthDays.length) {
                if (habitMap.get(this.formatDate(this.monthDays[i]))) completed++;
            }
        }

        return Math.round((completed / daysPassed) * 100);
    }

    // Modal Actions
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
            this.notification.warning('Please enter a habit name');
            return;
        }

        this.habitService.createHabit(this.habitForm).subscribe({
            next: (habit) => {
                this.habits.push(habit);
                this.closeAddHabitModal();
                this.loadHabits();
                this.notification.success(`Habit "${habit.name}" created!`);
            },
            error: () => this.notification.error('Failed to create habit')
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
                this.notification.success('Habit updated');
            },
            error: () => this.notification.error('Failed to update habit')
        });
    }

    deleteHabit(habit: Habit) {
        if (!habit.id) return;
        if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) return;

        this.habitService.deleteHabit(habit.id).subscribe({
            next: () => {
                this.habits = this.habits.filter(h => h.id !== habit.id);
                this.habitEntries.delete(habit.id!);
                this.notification.success('Habit deleted');
            },
            error: () => this.notification.error('Failed to delete habit')
        });
    }

    goToDashboard() {
        this.router.navigate(['/app']);
    }

    logout() {
        this.authService.logout();
        this.notification.info('You have been logged out');
    }

    // ========== Today Panel Methods ==========
    
    getTodayName(): string {
        return new Date().toLocaleDateString('en-US', { weekday: 'long' });
    }

    getTodayDate(): string {
        return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    getTodayHabits(): Habit[] {
        return this.habits.filter(h => !h.archived && h.frequency === 'daily');
    }

    getTodayCompleted(): number {
        const today = new Date();
        return this.getTodayHabits().filter(h => this.isHabitCompleted(h.id!, today)).length;
    }

    getTodayTotal(): number {
        return this.getTodayHabits().length;
    }

    getTodayProgressOffset(): number {
        const total = this.getTodayTotal();
        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        if (total === 0) return circumference;
        
        const completed = this.getTodayCompleted();
        const progress = completed / total;
        return circumference - (progress * circumference);
    }

    isHabitCompletedToday(habit: Habit): boolean {
        return this.isHabitCompleted(habit.id!, new Date());
    }

    toggleHabitToday(habit: Habit, event: MouseEvent) {
        this.toggleHabit(habit, new Date(), event);
    }

    getMotivationalMessage(): string {
        const completed = this.getTodayCompleted();
        const total = this.getTodayTotal();
        
        if (total === 0) return "Add some habits to get started!";
        if (completed === 0) return "Start your day strong! 💪";
        if (completed < total / 2) return "Keep going, you're doing great!";
        if (completed < total) return "Almost there! 🎯";
        return "Perfect day! You're amazing! 🌟";
    }

    calculateOverallStreak() {
        // Calculate how many consecutive days ALL daily habits were completed
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dailyHabits = this.habits.filter(h => h.frequency === 'daily' && !h.archived);
        if (dailyHabits.length === 0) {
            this.overallStreak = 0;
            return;
        }

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            
            // Skip today if not all habits are done yet
            if (i === 0) {
                const allDoneToday = dailyHabits.every(h => this.isHabitCompleted(h.id!, checkDate));
                if (!allDoneToday) continue;
            }
            
            const allCompleted = dailyHabits.every(h => this.isHabitCompleted(h.id!, checkDate));
            if (allCompleted) {
                streak++;
            } else {
                break;
            }
        }
        
        this.overallStreak = streak;
        
        // Calculate best streak from individual habits
        this.bestStreak = Math.max(
            ...this.habits.map(h => h.stats?.longestStreak || h.stats?.currentStreak || 0),
            this.overallStreak
        );
    }
}
