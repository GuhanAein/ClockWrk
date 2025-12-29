import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, Task } from '../../services/task';
import { AuthService, UserProfile } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { AppHeaderComponent } from '../../components/app-header/app-header';

interface CalendarEvent {
    task: Task;
    top: number;
    height: number;
    left: number;
    width: number;
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule, AppHeaderComponent],
    templateUrl: './calendar.html',
    styleUrls: ['./calendar.css']
})
export class CalendarComponent implements OnInit, AfterViewInit {
    @ViewChild('timeGrid') timeGridRef!: ElementRef;

    // User info
    username = 'User';
    userAvatarUrl = '';

    // View state
    currentView: 'month' | 'week' | 'day' = 'week';
    currentDate = new Date();
    sidebarCollapsed = false;

    // Data
    tasks: Task[] = [];
    weekDays: Date[] = [];
    monthDays: Date[] = [];
    miniMonthDays: Date[] = [];
    miniCalendarDate = new Date();

    // Time grid
    visibleHours: number[] = Array.from({ length: 24 }, (_, i) => i);
    hourHeight = 60; // pixels per hour

    // Drag state
    draggedTask: Task | null = null;

    // Quick add modal
    quickAddVisible = false;
    editingTask: Task | null = null;
    newTaskTitle = '';
    quickAddDateStr = '';
    quickAddStartTime = '09:00';
    quickAddEndTime = '10:00';
    quickAddAllDay = false;
    quickAddPriority = 0;

    constructor(
        private taskService: TaskService,
        private authService: AuthService,
        private notification: NotificationService,
        private router: Router
    ) { }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        // Load user profile
        this.authService.getProfile().subscribe({
            next: (user: UserProfile) => {
                this.username = user.name || 'User';
                this.userAvatarUrl = user.profilePictureUrl || '';
            },
            error: () => { }
        });

        this.generateWeekDays();
        this.generateMonthDays();
        this.generateMiniMonthDays();
        this.loadTasks();
    }

    ngAfterViewInit() {
        // Scroll to current time on load
        setTimeout(() => this.scrollToCurrentTime(), 100);
    }

    scrollToCurrentTime() {
        if (this.timeGridRef?.nativeElement) {
            const now = new Date();
            const scrollPosition = (now.getHours() - 1) * this.hourHeight;
            this.timeGridRef.nativeElement.scrollTop = Math.max(0, scrollPosition);
        }
    }

    // ========== Data Loading ==========

    loadTasks() {
        let start: string;
        let end: string;

        if (this.currentView === 'month') {
            const first = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const last = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            start = this.formatDateISO(first);
            end = this.formatDateISO(last);
        } else if (this.currentView === 'day') {
            start = this.formatDateISO(this.currentDate);
            end = start;
        } else {
            start = this.formatDateISO(this.weekDays[0]);
            end = this.formatDateISO(this.weekDays[6]);
        }

        this.taskService.getTasksForCalendar(start, end).subscribe({
            next: (tasks) => {
                this.tasks = tasks;
            },
            error: (err) => {
                console.error('Failed to load tasks', err);
                this.notification.error('Failed to load calendar events');
            }
        });
    }

    // ========== Date Generation ==========

    generateWeekDays() {
        const start = this.getWeekStart(this.currentDate);
        this.weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }

    getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    generateMonthDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(firstDay.getDate() + diff);

        this.monthDays = Array.from({ length: 42 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });
    }

    generateMiniMonthDays() {
        const year = this.miniCalendarDate.getFullYear();
        const month = this.miniCalendarDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(firstDay.getDate() + diff);

        this.miniMonthDays = Array.from({ length: 42 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });
    }

    getViewDays(): Date[] {
        if (this.currentView === 'day') {
            return [this.currentDate];
        }
        return this.weekDays;
    }

    // ========== Navigation ==========

    navigatePrev() {
        if (this.currentView === 'month') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
            this.generateMonthDays();
        } else if (this.currentView === 'day') {
            this.currentDate = new Date(this.currentDate.getTime() - 86400000);
        } else {
            this.currentDate = new Date(this.currentDate.getTime() - 7 * 86400000);
            this.generateWeekDays();
        }
        this.loadTasks();
    }

    navigateNext() {
        if (this.currentView === 'month') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
            this.generateMonthDays();
        } else if (this.currentView === 'day') {
            this.currentDate = new Date(this.currentDate.getTime() + 86400000);
        } else {
            this.currentDate = new Date(this.currentDate.getTime() + 7 * 86400000);
            this.generateWeekDays();
        }
        this.loadTasks();
    }

    today() {
        this.currentDate = new Date();
        this.generateWeekDays();
        this.generateMonthDays();
        this.loadTasks();
        setTimeout(() => this.scrollToCurrentTime(), 100);
    }

    goToDate(date: Date) {
        this.currentDate = new Date(date);
        this.generateWeekDays();
        this.generateMonthDays();
        this.loadTasks();
    }

    switchView(view: 'month' | 'week' | 'day') {
        this.currentView = view;
        if (view === 'week') {
            this.generateWeekDays();
        } else if (view === 'month') {
            this.generateMonthDays();
        }
        this.loadTasks();
    }

    prevMiniMonth() {
        this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() - 1, 1);
        this.generateMiniMonthDays();
    }

    nextMiniMonth() {
        this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() + 1, 1);
        this.generateMiniMonthDays();
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    // ========== Event Helpers ==========

    getTimedEventsForDay(day: Date): CalendarEvent[] {
        const dayStr = this.formatDateISO(day);
        const dayTasks = this.tasks.filter(task => {
            if (!task.startTime || task.allDay) return false;
            const taskDate = new Date(task.startTime);
            return this.formatDateISO(taskDate) === dayStr;
        });

        // Sort by start time
        dayTasks.sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

        // Calculate positions (simple column layout for overlaps)
        const events: CalendarEvent[] = [];
        const columns: CalendarEvent[][] = [];

        dayTasks.forEach(task => {
            const event = this.calculateEventPosition(task);
            
            // Find a column that doesn't overlap
            let placed = false;
            for (let col = 0; col < columns.length; col++) {
                const lastInCol = columns[col][columns[col].length - 1];
                if (lastInCol.top + lastInCol.height <= event.top) {
                    columns[col].push(event);
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                columns.push([event]);
            }
            
            events.push(event);
        });

        // Adjust widths based on columns
        const totalCols = columns.length || 1;
        const width = 100 / totalCols;
        
        columns.forEach((col, colIndex) => {
            col.forEach(event => {
                event.left = colIndex * width;
                event.width = width - 2; // Small gap
            });
        });

        return events;
    }

    getAllDayTasks(day: Date): Task[] {
        const dayStr = this.formatDateISO(day);
        return this.tasks.filter(task => {
            if (task.allDay) {
                return task.dueDate === dayStr;
            }
            return false;
        });
    }

    getTasksForMonthDay(day: Date): Task[] {
        const dayStr = this.formatDateISO(day);
        return this.tasks.filter(task => {
            if (task.startTime) {
                return this.formatDateISO(new Date(task.startTime)) === dayStr;
            }
            return task.dueDate === dayStr;
        });
    }

    calculateEventPosition(task: Task): CalendarEvent {
        const start = new Date(task.startTime!);
        const hours = start.getHours();
        const minutes = start.getMinutes();
        const top = (hours * this.hourHeight) + (minutes / 60 * this.hourHeight);

        let height = this.hourHeight;
        if (task.endTime) {
            const end = new Date(task.endTime);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            height = Math.max(30, duration * this.hourHeight);
        } else if (task.durationMinutes) {
            height = Math.max(30, (task.durationMinutes / 60) * this.hourHeight);
        }

        return { task, top, height, left: 0, width: 100 };
    }

    getCurrentTimePosition(): number {
        const now = new Date();
        return (now.getHours() * this.hourHeight) + (now.getMinutes() / 60 * this.hourHeight);
    }

    hasEventsOnDay(day: Date): boolean {
        return this.getTasksForMonthDay(day).length > 0;
    }

    // ========== Quick Add Modal ==========

    openQuickAdd(date?: Date, hour?: number) {
        this.editingTask = null;
        this.newTaskTitle = '';
        
        const targetDate = date || this.currentDate;
        this.quickAddDateStr = this.formatDateISO(targetDate);
        
        if (hour !== undefined) {
            this.quickAddStartTime = `${hour.toString().padStart(2, '0')}:00`;
            this.quickAddEndTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            this.quickAddAllDay = false;
        } else {
            const now = new Date();
            this.quickAddStartTime = `${now.getHours().toString().padStart(2, '0')}:00`;
            this.quickAddEndTime = `${(now.getHours() + 1).toString().padStart(2, '0')}:00`;
            this.quickAddAllDay = false;
        }
        
        this.quickAddPriority = 0;
        this.quickAddVisible = true;
    }

    openTaskDetail(task: Task) {
        this.editingTask = task;
        this.newTaskTitle = task.title;
        this.quickAddPriority = task.priority || 0;
        this.quickAddAllDay = task.allDay || false;
        
        if (task.startTime) {
            const start = new Date(task.startTime);
            this.quickAddDateStr = this.formatDateISO(start);
            this.quickAddStartTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
            
            if (task.endTime) {
                const end = new Date(task.endTime);
                this.quickAddEndTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
            }
        } else if (task.dueDate) {
            this.quickAddDateStr = task.dueDate;
        }
        
        this.quickAddVisible = true;
    }

    closeQuickAdd() {
        this.quickAddVisible = false;
        this.editingTask = null;
    }

    saveTask() {
        if (!this.newTaskTitle.trim()) {
            this.notification.warning('Please enter an event title');
            return;
        }

        const [startHour, startMin] = this.quickAddStartTime.split(':').map(Number);
        const [endHour, endMin] = this.quickAddEndTime.split(':').map(Number);

        const startTime = new Date(this.quickAddDateStr);
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(this.quickAddDateStr);
        endTime.setHours(endHour, endMin, 0, 0);

        const durationMinutes = Math.max(1, (endTime.getTime() - startTime.getTime()) / 60000);

        const taskData: Task = {
            title: this.newTaskTitle,
            completed: this.editingTask?.completed || false,
            priority: this.quickAddPriority,
            dueDate: this.quickAddDateStr,
            startTime: this.quickAddAllDay ? undefined : startTime.toISOString(),
            endTime: this.quickAddAllDay ? undefined : endTime.toISOString(),
            allDay: this.quickAddAllDay,
            durationMinutes: this.quickAddAllDay ? undefined : durationMinutes,
            listName: this.editingTask?.listName || 'Inbox'
        };

        if (this.editingTask?.id) {
            this.taskService.updateTask(this.editingTask.id, taskData).subscribe({
                next: (updated) => {
                    const index = this.tasks.findIndex(t => t.id === updated.id);
                    if (index !== -1) {
                        this.tasks[index] = updated;
                    }
                    this.closeQuickAdd();
                    this.notification.success('Event updated');
                },
                error: () => this.notification.error('Failed to update event')
            });
        } else {
            this.taskService.createTask(taskData).subscribe({
                next: (task) => {
                    this.tasks.push(task);
                    this.closeQuickAdd();
                    this.notification.success('Event created');
                },
                error: () => this.notification.error('Failed to create event')
            });
        }
    }

    deleteTask() {
        if (!this.editingTask?.id) return;
        
        if (confirm('Delete this event?')) {
            this.taskService.deleteTask(this.editingTask.id).subscribe({
                next: () => {
                    this.tasks = this.tasks.filter(t => t.id !== this.editingTask?.id);
                    this.closeQuickAdd();
                    this.notification.success('Event deleted');
                },
                error: () => this.notification.error('Failed to delete event')
            });
        }
    }

    onTimeSlotClick(day: Date, hour: number, event: MouseEvent) {
        this.openQuickAdd(day, hour);
    }

    // ========== Drag & Drop ==========

    onDragStart(event: DragEvent, task: Task) {
        this.draggedTask = task;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    onDrop(event: DragEvent, day: Date, hour: number) {
        event.preventDefault();
        if (!this.draggedTask?.id) return;

        const newStart = new Date(day);
        newStart.setHours(hour, 0, 0, 0);

        const duration = this.draggedTask.durationMinutes || 60;
        const newEnd = new Date(newStart);
        newEnd.setMinutes(newEnd.getMinutes() + duration);

        this.taskService.rescheduleTask(
            this.draggedTask.id,
            newStart.toISOString(),
            newEnd.toISOString()
        ).subscribe({
            next: (updated) => {
                const index = this.tasks.findIndex(t => t.id === updated.id);
                if (index !== -1) {
                    this.tasks[index] = updated;
                }
                this.notification.success('Event moved');
            },
            error: () => this.notification.error('Failed to move event')
        });

        this.draggedTask = null;
    }

    // ========== Stats & Helpers ==========

    getTodayTaskCount(): number {
        const today = this.formatDateISO(new Date());
        return this.tasks.filter(t => {
            if (t.startTime) return this.formatDateISO(new Date(t.startTime)) === today;
            return t.dueDate === today;
        }).length;
    }

    getWeekTaskCount(): number {
        return this.tasks.length;
    }

    getOverdueCount(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.tasks.filter(t => {
            if (t.completed) return false;
            const dueDate = t.dueDate ? new Date(t.dueDate) : null;
            return dueDate && dueDate < today;
        }).length;
    }

    getUpcomingTasks(): Task[] {
        const now = new Date();
        return this.tasks
            .filter(t => {
                if (t.completed) return false;
                const taskDate = t.startTime ? new Date(t.startTime) : (t.dueDate ? new Date(t.dueDate) : null);
                return taskDate && taskDate >= now;
            })
            .sort((a, b) => {
                const aDate = a.startTime ? new Date(a.startTime) : new Date(a.dueDate!);
                const bDate = b.startTime ? new Date(b.startTime) : new Date(b.dueDate!);
                return aDate.getTime() - bDate.getTime();
            });
    }

    // ========== Formatting ==========

    formatDateISO(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatHour(hour: number): string {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    }

    formatEventTimeRange(task: Task): string {
        if (!task.startTime) return '';
        const start = new Date(task.startTime);
        let result = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (task.endTime) {
            const end = new Date(task.endTime);
            result += ' - ' + end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return result;
    }

    formatUpcomingTime(task: Task): string {
        if (task.startTime) {
            const start = new Date(task.startTime);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (this.isSameDay(start, today)) {
                return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else if (this.isSameDay(start, tomorrow)) {
                return 'Tomorrow ' + start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
            return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return task.dueDate || '';
    }

    getCurrentRangeTitle(): string {
        if (this.currentView === 'day') {
            return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } else if (this.currentView === 'month') {
            return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
            const start = this.weekDays[0];
            const end = this.weekDays[6];
            if (start.getMonth() === end.getMonth()) {
                return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
            }
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
    }

    // ========== Date Helpers ==========

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isSameDay(d1: Date, d2: Date): boolean {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    isSameMonth(d1: Date, d2: Date): boolean {
        return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }

    // ========== Colors ==========

    getEventColor(task: Task): string {
        if (task.completed) return '#9CA3AF';
        switch (task.priority) {
            case 3: return '#EF4444';
            case 2: return '#F59E0B';
            case 1: return '#3B82F6';
            default: return '#6366F1';
        }
    }

    getPriorityColor(priority: number): string {
        switch (priority) {
            case 3: return '#EF4444';
            case 2: return '#F59E0B';
            case 1: return '#3B82F6';
            default: return '#6366F1';
        }
    }

    getPriorityLabel(priority: number): string {
        switch (priority) {
            case 3: return 'High';
            case 2: return 'Medium';
            case 1: return 'Low';
            default: return 'None';
        }
    }

    // ========== Settings ==========

    openSettingsModal() {
        this.router.navigate(['/app'], { queryParams: { openSettings: true } });
    }
}
