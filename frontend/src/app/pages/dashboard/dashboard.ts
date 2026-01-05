import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import { TaskService, Task, CustomList } from '../../services/task';
import { AuthService, UserProfile } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { CalendarComponent } from '../calendar/calendar';
import { AppHeaderComponent } from '../../components/app-header/app-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CalendarComponent, AppHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  customLists: CustomList[] = [];
  newTaskTitle = '';

  // Sidebar state
  currentFilter = 'today';
  selectedTask: Task | null = null;
  saveStatus = '';
  activeMoveTaskId: string | null = null;
  isSidebarOpen = true;

  // Pomodoro State
  pomoTime = 25 * 60;
  pomoInitialTime = 25 * 60;
  pomoIsRunning = false;
  pomoInterval: any;
  focusedTask: Task | null = null;
  pomoMode: 'focus' | 'short' | 'long' = 'focus';

  // Stats
  pomoStats = {
    sessionsCompleted: 0,
    totalMinutes: 0,
    tasksCompletedInFocus: 0
  };

  // Timeline State
  timelineHours: number[] = [];
  pomoStartTime: Date | null = null;

  username = '';
  userAvatarUrl = '';

  constructor(
    public taskService: TaskService,
    public authService: AuthService,
    private notification: NotificationService,
    public router: Router,
    private route: ActivatedRoute
  ) {
    this.generateTimeline();
  }

  get focusBlockHeight(): number {
    if (this.pomoMode === 'focus') return 25;
    if (this.pomoMode === 'short') return 5;
    return 15;
  }

  generateTimeline() {
    const currentHour = new Date().getHours();
    for (let i = -1; i < 5; i++) {
      let h = currentHour + i;
      if (h > 23) h -= 24;
      if (h < 0) h += 24;
      this.timelineHours.push(h);
    }
  }

  get currentTimePosition(): number {
    const now = new Date();
    const startHour = this.timelineHours[0];
    let hourDiff = now.getHours() - startHour;
    if (hourDiff < 0) hourDiff += 24;
    return (hourDiff * 60) + now.getMinutes();
  }

  get focusBlockPosition(): number {
    if (!this.pomoStartTime) return this.currentTimePosition;
    const startHour = this.timelineHours[0];
    let hourDiff = this.pomoStartTime.getHours() - startHour;
    if (hourDiff < 0) hourDiff += 24;
    return (hourDiff * 60) + this.pomoStartTime.getMinutes();
  }

  get focusTimeRange(): string {
    if (!this.pomoStartTime) return '';
    const end = new Date(this.pomoStartTime.getTime() + 25 * 60000);
    const format = (d: Date) => `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${format(this.pomoStartTime)}-${format(end)}`;
  }

  get pomoMinutes(): string {
    const m = Math.floor(this.pomoTime / 60);
    return m < 10 ? '0' + m : '' + m;
  }

  get pomoSeconds(): string {
    const s = this.pomoTime % 60;
    return s < 10 ? '0' + s : '' + s;
  }

  get pomoProgress(): number {
    const radius = 170;
    const circumference = 2 * Math.PI * radius;
    const percentRemaining = this.pomoTime / this.pomoInitialTime;
    return circumference - (percentRemaining * circumference);
  }

  setPomoMode(mode: 'focus' | 'short' | 'long') {
    this.pomoMode = mode;
    this.pausePomo();

    switch (mode) {
      case 'focus': this.pomoInitialTime = 25 * 60; break;
      case 'short': this.pomoInitialTime = 5 * 60; break;
      case 'long': this.pomoInitialTime = 15 * 60; break;
    }
    this.pomoTime = this.pomoInitialTime;
  }

  togglePomo() {
    if (this.pomoIsRunning) {
      this.pausePomo();
    } else {
      this.startPomo();
    }
  }

  startPomo() {
    if (!this.pomoStartTime) {
      this.pomoStartTime = new Date();
    }
    this.pomoIsRunning = true;

    if (this.pomoInterval) clearInterval(this.pomoInterval);

    this.pomoInterval = setInterval(() => {
      if (this.pomoTime > 0) {
        this.pomoTime--;
      } else {
        this.completePomo();
      }
    }, 1000);
  }

  pausePomo() {
    this.pomoIsRunning = false;
    if (this.pomoInterval) {
      clearInterval(this.pomoInterval);
      this.pomoInterval = null;
    }
  }

  resetPomo() {
    this.pausePomo();
    this.pomoTime = this.pomoInitialTime;
    this.pomoStartTime = null;
  }

  completePomo() {
    this.pausePomo();
    this.pomoTime = this.pomoInitialTime;
    this.pomoStartTime = null;

    if (this.pomoMode === 'focus') {
      this.pomoStats.sessionsCompleted++;
      this.pomoStats.totalMinutes += 25;
      if (this.focusedTask) {
        this.pomoStats.tasksCompletedInFocus++;
      }
    }

    // Try to play notification sound
    try {
      const audio = new Audio('assets/sounds/bell.mp3');
      audio.play().catch(() => { });
    } catch (e) {
      // Silently fail if audio not available
    }

    const message = this.pomoMode === 'focus' ? 'Focus session completed! Time for a break.' : 'Break is over! Ready to focus?';
    this.notification.success(message, 'Pomodoro');
  }

  selectFocusTask(e: any) {
    const taskId = e.target.value;
    if (!taskId) {
      this.focusedTask = null;
      return;
    }
    this.focusedTask = this.tasks.find(t => t.id === taskId) || null;
  }

  ngOnInit() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isSidebarOpen = false;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getProfile().subscribe({
      next: (user: UserProfile) => {
        this.username = user.name || 'User';
        this.userAvatarUrl = user.profilePictureUrl || '';
      },
      error: () => this.notification.error('Failed to load profile')
    });

    // Check for openSettings query param (from other pages)
    this.route.queryParams.subscribe(params => {
      if (params['openSettings']) {
        this.openProfileModal();
        // Clear the query param
        this.router.navigate([], { queryParams: {} });
      }
    });

    this.loadLists();
    this.loadTasks();
  }

  loadLists() {
    this.taskService.getLists().subscribe({
      next: (lists) => this.customLists = lists,
      error: () => this.notification.error('Failed to load lists')
    });
  }

  addList() {
    const name = prompt("Enter list name:");
    if (!name) return;

    this.taskService.createList(name).subscribe({
      next: (list) => {
        this.customLists.push(list);
        this.notification.success(`List "${name}" created`);
      },
      error: () => this.notification.error('Failed to create list')
    });
  }

  loadTasks() {
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilter();
      },
      error: () => this.notification.error('Failed to load tasks')
    });
  }

  setFilter(filter: string) {
    this.currentFilter = filter;
    this.selectedTask = null;
    if (filter !== 'habits') {
      this.applyFilter();
    }
  }

  applyFilter() {
    const today = new Date().toISOString().split('T')[0];

    switch (this.currentFilter) {
      case 'today':
        this.filteredTasks = this.tasks.filter(t => !t.completed && (!t.dueDate || t.dueDate === today));
        break;
      case 'inbox':
        this.filteredTasks = this.tasks.filter(t => !t.completed && (!t.listName || t.listName === 'Inbox'));
        break;
      case 'next7':
        this.filteredTasks = this.tasks.filter(t => !t.completed && t.dueDate && t.dueDate > today);
        break;
      case 'completed':
        this.filteredTasks = this.tasks.filter(t => t.completed);
        break;
      default:
        this.filteredTasks = this.tasks.filter(t => !t.completed && t.listName?.toLowerCase() === this.currentFilter.toLowerCase());
    }
  }

  selectTask(task: Task) {
    this.selectedTask = { ...task };

    if (task.startTime) {
      const start = new Date(task.startTime);
      this.taskStartTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
    } else {
      this.taskStartTime = '';
    }

    if (task.endTime) {
      const end = new Date(task.endTime);
      this.taskEndTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    } else {
      this.taskEndTime = '';
    }
  }

  taskStartTime = '';
  taskEndTime = '';

  updateTaskTime() {
    if (!this.selectedTask || !this.selectedTask.dueDate) return;

    if (this.taskStartTime && this.taskEndTime) {
      const [startHour, startMin] = this.taskStartTime.split(':').map(Number);
      const [endHour, endMin] = this.taskEndTime.split(':').map(Number);

      const startDate = new Date(this.selectedTask.dueDate);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(this.selectedTask.dueDate);
      endDate.setHours(endHour, endMin, 0, 0);

      this.selectedTask.startTime = startDate.toISOString();
      this.selectedTask.endTime = endDate.toISOString();
      this.selectedTask.allDay = false;

      const durationMs = endDate.getTime() - startDate.getTime();
      this.selectedTask.durationMinutes = Math.max(1, Math.floor(durationMs / 60000));
    } else {
      this.selectedTask.startTime = undefined;
      this.selectedTask.endTime = undefined;
      this.selectedTask.allDay = true;
      this.selectedTask.durationMinutes = undefined;
    }

    this.updateSelectedTask();
  }

  updateSelectedTask() {
    if (!this.selectedTask || !this.selectedTask.id) return;

    this.saveStatus = 'Saving...';

    this.taskService.updateTask(this.selectedTask.id, this.selectedTask).subscribe({
      next: (updated) => {
        const index = this.tasks.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          this.tasks[index] = updated;
          this.applyFilter();
        }
        this.saveStatus = 'Saved';
        setTimeout(() => this.saveStatus = '', 2000);
      },
      error: () => {
        this.saveStatus = 'Error saving';
        this.notification.error('Failed to save changes');
      }
    });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;

    const newTask: Task = {
      title: this.newTaskTitle,
      completed: false,
      priority: 0,
      dueDate: this.currentFilter === 'today' ? new Date().toISOString().split('T')[0] : undefined,
      listName: ['today', 'next7', 'inbox', 'completed'].includes(this.currentFilter) ? 'Inbox' :
        (this.customLists.find(l => l.name.toLowerCase() === this.currentFilter.toLowerCase())?.name || 'Inbox')
    };

    this.taskService.createTask(newTask).subscribe({
      next: (task) => {
        this.tasks.push(task);
        this.newTaskTitle = '';
        this.applyFilter();
      },
      error: () => this.notification.error('Failed to create task')
    });
  }

  getTasksByPriority(priority: number): Task[] {
    return this.tasks.filter(t => !t.completed && t.priority === priority);
  }

  toggleComplete(task: Task) {
    if (!task.id) return;

    task.completed = !task.completed;
    this.applyFilter();

    this.taskService.toggleComplete(task.id).subscribe({
      error: () => {
        task.completed = !task.completed;
        this.applyFilter();
        this.notification.error('Failed to update task');
      }
    });
  }

  deleteTask(task: Task) {
    if (!task.id) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.applyFilter();
        this.notification.success('Task deleted');
      },
      error: () => this.notification.error('Failed to delete task')
    });
  }

  logout() {
    this.authService.logout();
    this.notification.info('You have been logged out');
  }

  // Profile Management State
  isProfileMenuOpen = false;
  isProfileModalOpen = false;
  activeProfileTab: 'general' | 'security' = 'general';

  editProfileData = {
    name: '',
    profilePictureUrl: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  onMatrixDrop(event: CdkDragDrop<Task[]>, newPriority: number) {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.item.data as Task;
    if (!task) return;

    task.priority = newPriority;

    this.taskService.updateTask(task.id!, task).subscribe({
      next: (updated) => {
        const idx = this.tasks.findIndex(t => t.id === updated.id);
        if (idx !== -1) {
          this.tasks[idx] = updated;
        }
      },
      error: () => this.notification.error('Failed to move task')
    });
  }

  addMatrixTask(priority: number, event: any) {
    const title = event.target.value.trim();
    if (!title) return;

    const newTask: Task = {
      title: title,
      completed: false,
      priority: priority,
      listName: 'Inbox',
      dueDate: undefined
    };

    this.taskService.createTask(newTask).subscribe({
      next: (task) => {
        this.tasks.push(task);
        event.target.value = '';
      },
      error: () => this.notification.error('Failed to create task')
    });
  }

  toggleMoveMenu(event: Event, task: Task) {
    event.stopPropagation();
    if (this.activeMoveTaskId === task.id) {
      this.activeMoveTaskId = null;
    } else {
      this.activeMoveTaskId = task.id || null;
      this.isProfileMenuOpen = false;
    }
  }

  moveTask(task: Task, listName: string) {
    if (!task.id) return;

    const previousList = task.listName;
    task.listName = listName;
    this.activeMoveTaskId = null;
    this.applyFilter();

    this.taskService.updateTask(task.id, task).subscribe({
      next: (updated) => {
        const index = this.tasks.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          this.tasks[index] = updated;
        }
        this.notification.success(`Moved to ${listName}`);
      },
      error: () => {
        task.listName = previousList;
        this.applyFilter();
        this.notification.error('Failed to move task');
      }
    });
  }

  // Profile Methods
  toggleProfileMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  openProfileModal() {
    this.isProfileMenuOpen = false;
    this.isProfileModalOpen = true;
    this.editProfileData.name = this.username;
    this.editProfileData.profilePictureUrl = this.userAvatarUrl;
  }

  closeProfileModal() {
    this.isProfileModalOpen = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.notification.error('File is too large. Max 2MB.');
        return;
      }
      this.authService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.editProfileData.profilePictureUrl = res.url;
          this.notification.success('Image uploaded');
        },
        error: () => this.notification.error('Failed to upload image')
      });
    }
  }

  saveProfile() {
    this.authService.updateProfile(this.editProfileData).subscribe({
      next: (user: UserProfile) => {
        this.username = user.name;
        this.userAvatarUrl = user.profilePictureUrl || '';
        this.notification.success('Profile updated successfully');
        this.closeProfileModal();
      },
      error: () => this.notification.error('Failed to update profile')
    });
  }

  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.notification.error('Passwords do not match');
      return;
    }

    if (this.passwordData.newPassword.length < 8) {
      this.notification.error('Password must be at least 8 characters');
      return;
    }

    this.authService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.notification.success('Password changed successfully');
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.closeProfileModal();
      },
      error: (err) => {
        const message = err.error?.message || 'Failed to change password';
        this.notification.error(message);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.activeMoveTaskId) {
      this.activeMoveTaskId = null;
    }
    if (this.isProfileMenuOpen) {
      this.isProfileMenuOpen = false;
    }
  }

  goToHabits() {
    this.router.navigate(['/habits']);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
