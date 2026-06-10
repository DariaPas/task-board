import { Injectable, computed, effect, signal } from '@angular/core';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';

const STORAGE_KEY = 'task-board-tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tasks = signal<Task[]>(this.loadFromStorage());

  readonly priorityFilter = signal<TaskPriority | 'all'>('all');

  readonly filteredTasks = computed(() => {
    const filter = this.priorityFilter();

    if (filter === 'all') {
      return this.tasks();
    }

    return this.tasks().filter((task) => task.priority === filter);
  });

  readonly todoTasks = computed(() =>
    this.filteredTasks().filter((task) => task.status === 'todo'),
  );

  readonly inProgressTasks = computed(() =>
    this.filteredTasks().filter((task) => task.status === 'in-progress'),
  );

  readonly doneTasks = computed(() =>
    this.filteredTasks().filter((task) => task.status === 'done'),
  );

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks()));
    });
  }

  addTask(data: Omit<Task, 'id' | 'status'>): void {
    const newTask: Task = {
      ...data,
      id: crypto.randomUUID(),
      status: 'todo',
    };

    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  moveTask(id: string, status: TaskStatus): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  }

  deleteTask(id: string): void {
    this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  setPriorityFilter(priority: TaskPriority | 'all'): void {
    this.priorityFilter.set(priority);
  }

  private loadFromStorage(): Task[] {
    const rawTasks = localStorage.getItem(STORAGE_KEY);

    if (!rawTasks) {
      return [];
    }

    try {
      return JSON.parse(rawTasks) as Task[];
    } catch {
      return [];
    }
  }
}