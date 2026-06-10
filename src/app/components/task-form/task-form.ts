import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm {
  createTask = output<Omit<Task, 'id' | 'status'>>();

  title = signal('');
  description = signal('');
  priority = signal<TaskPriority>('medium');

  submit(): void {
    const trimmedTitle = this.title().trim();

    if (!trimmedTitle) {
      return;
    }

    this.createTask.emit({
      title: trimmedTitle,
      description: this.description().trim(),
      priority: this.priority(),
    });

    this.title.set('');
    this.description.set('');
    this.priority.set('medium');
  }
}