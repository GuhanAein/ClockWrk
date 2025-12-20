import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TaskService, Task, CustomList } from '../../services/task';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  customLists: CustomList[] = [];
  newTaskTitle = '';

  // Sidebar state
  currentFilter = 'today'; // today, inbox, next7, work, personal, completed, trash, focus, matrix, habits

  selectedTask: Task | null = null;
  saveStatus = '';

  // Pomodoro State
  pomoTime = 25 * 60; // 25 minutes in seconds
  pomoInitialTime = 25 * 60;
  pomoIsRunning = false;
  pomoInterval: any;
  focusedTask: Task | null = null;

  // Timeline State
  timelineHours: number[] = [];
  pomoStartTime: Date | null = null;

  // Habits State
  habitUrlInput = '';
  safeHabitUrl: SafeResourceUrl | null = null;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.generateTimeline();
    this.loadHabitUrl();
  }

  loadHabitUrl() {
    const stored = localStorage.getItem('habitSheetUrl');
    if (stored) {
      // Ensure embed mode for cleaner look if standard link provided
      // Replace /edit... with /edit?widget=true&headers=false if desired, or just trust iframe
      // Actually simpler: just trust user input but sanitize
      this.safeHabitUrl = this.sanitizer.bypassSecurityTrustResourceUrl(stored);
    }
  }

  saveHabitUrl() {
    if (!this.habitUrlInput) return;
    localStorage.setItem('habitSheetUrl', this.habitUrlInput);
    this.loadHabitUrl();
  }

  resetHabitSettings() {
    if (confirm('Disconnect this sheet?')) {
      localStorage.removeItem('habitSheetUrl');
      this.safeHabitUrl = null;
      this.habitUrlInput = '';
    }
  }

  generateTimeline() {
    const currentHour = new Date().getHours();
    // Show from 1 hour before to 5 hours after
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
    if (hourDiff < 0) hourDiff += 24; // Handle midnight wrap
    return (hourDiff * 60) + now.getMinutes();
  }

  get focusBlockPosition(): number {
    if (!this.pomoStartTime) return this.currentTimePosition;
    const startHour = this.timelineHours[0];
    let hourDiff = this.pomoStartTime.getHours() - startHour;
    if (hourDiff < 0) hourDiff += 24;
    return (hourDiff * 60) + this.pomoStartTime.getMinutes();
  }

  get focusBlockHeight(): number {
    // Height corresponds to 25 mins roughly (if 60px = 60mins, then 25px)
    return 25;
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
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference - (this.pomoTime / this.pomoInitialTime) * circumference;
    return offset;
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
    this.pomoInterval = setInterval(() => {
      if (this.pomoTime > 0) {
        this.pomoTime--;
      } else {
        this.pausePomo();
        // Play sound or notify
        alert('Pomodoro finished!');
        this.pomoTime = this.pomoInitialTime;
        this.pomoStartTime = null;
      }
    }, 1000);
  }

  pausePomo() {
    this.pomoIsRunning = false;
    clearInterval(this.pomoInterval);
  }

  resetPomo() {
    this.pausePomo();
    this.pomoTime = this.pomoInitialTime;
    this.pomoStartTime = null;
  }

  selectFocusTask(e: any) {
    const taskId = e.target.value;
    if (!taskId) {
      this.focusedTask = null;
      return;
    }
    this.focusedTask = this.tasks.find(t => t.id === taskId) || null;
  }

  username = '';

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getProfile().subscribe({
      next: (user) => {
        this.username = user.name || 'User';
        this.userAvatarUrl = user.profilePictureUrl || '';
      },
      error: () => console.error('Failed to load profile')
    });

    this.loadLists();
    this.loadTasks();
  }

  loadLists() {
    this.taskService.getLists().subscribe({
      next: (lists) => this.customLists = lists,
      error: (err) => console.error('Failed to load lists', err)
    });
  }

  addList() {
    const name = prompt("Enter list name:");
    if (!name) return;

    this.taskService.createList(name).subscribe({
      next: (list) => {
        this.customLists.push(list);
      },
      error: (err) => console.error('Failed to create list', err)
    });
  }

  loadTasks() {
    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilter();
      },
      error: (err) => console.error('Failed to load tasks', err)
    });
  }

  setFilter(filter: string) {
    if (filter === 'habits') {
      this.router.navigate(['/habits']);
      return;
    }
    this.currentFilter = filter;
    this.selectedTask = null; // Deselect on filter change
    this.applyFilter();
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
      error: (err) => {
        console.error('Failed to update', err);
        this.saveStatus = 'Error saving';
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
      error: (err) => console.error('Failed to create task', err)
    });
  }

  getTasksByPriority(priority: number): Task[] {
    // Q1: High (3) -> Urgent & Important
    // Q2: Med (2) -> Not Urgent & Important
    // Q3: Low (1) -> Urgent & Unimportant
    // Q4: None (0) -> Not Urgent & Unimportant
    return this.tasks.filter(t => !t.completed && t.priority === priority);
  }

  toggleComplete(task: Task) {
    if (!task.id) return;

    task.completed = !task.completed;
    this.applyFilter();

    this.taskService.toggleComplete(task.id).subscribe({
      error: (err) => {
        console.error('Failed to toggle', err);
        task.completed = !task.completed;
        this.applyFilter();
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
      },
      error: (err) => console.error('Failed to delete', err)
    });
  }

  logout() {
    this.authService.logout();
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

  userAvatarUrl = '';

  onMatrixDrop(event: CdkDragDrop<Task[]>, newPriority: number) {
    if (event.previousContainer === event.container) {
      return;
    }

    // Moving between quadrants
    const task = event.item.data as Task;
    if (!task) return;

    // Update priority local first for instant feedback (though filter loop might fight it)
    task.priority = newPriority;

    // Explicitly update backend
    this.taskService.updateTask(task.id!, task).subscribe({
      next: (updated) => {
        // ensure local matches updated
        const idx = this.tasks.findIndex(t => t.id === updated.id);
        if (idx !== -1) {
          this.tasks[idx] = updated;
          // No need to call applyFilter() explicitly if getter is used in view, but doesn't hurt.
        }
      },
      error: (err) => {
        console.error('Failed to move task', err);
        // Revert logic could go here
      }
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
        event.target.value = ''; // Clear
      },
      error: (err) => console.error('Failed to create matrix task', err)
    });
  }

  // Profile Methods
  toggleProfileMenu() {
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
        alert('File is too large. Max 2MB.');
        return;
      }
      this.authService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.editProfileData.profilePictureUrl = res.url;
          // Optional: Auto-save if desired, but user can just click Save Changes
        },
        error: (err) => alert('Failed to upload image')
      });
    }
  }

  saveProfile() {
    this.authService.updateProfile(this.editProfileData).subscribe({
      next: (user) => {
        this.username = user.name;
        this.userAvatarUrl = user.profilePictureUrl || '';
        alert('Profile updated successfully');
        this.closeProfileModal();
      },
      error: (err) => alert('Failed to update profile')
    });
  }

  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.authService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        alert('Password changed successfully');
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.closeProfileModal();
      },
      error: (err) => alert('Failed to change password')
    });
  }
}
