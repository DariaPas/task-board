import { Component, inject, signal } from '@angular/core';
import { Task, TaskPriority, TaskStatus } from '../../models/task.model';
import { TaskStore } from '../../store/task.store';
//import { TaskService } from '../../services/task';
import { TaskColumn } from '../task-column/task-column';
import { TaskForm } from '../task-form/task-form';

@Component({
  selector: 'app-task-board',
  imports: [TaskColumn, TaskForm],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoard {
  readonly taskStore = inject(TaskStore);

  readonly showForm = signal(false);

  toggleForm(): void {
    this.showForm.update((value) => !value);
  }

  addTask(task: Omit<Task, 'id' | 'status'>): void {
    this.taskStore.addTask(task);
    this.showForm.set(false);
  }

  moveTask(event: { id: string; status: TaskStatus }): void {
    this.taskStore.moveTask(event.id, event.status);
  }

  deleteTask(id: string): void {
    this.taskStore.deleteTask(id);
  }

  setPriorityFilter(priority: string): void {
    this.taskStore.setPriorityFilter(priority as TaskPriority | 'all');
  }
}