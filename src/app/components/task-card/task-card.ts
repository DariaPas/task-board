import { Component, input, output } from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCard {
  task = input.required<Task>();

  statusChange = output<TaskStatus>();
  delete = output<string>();

  moveTo(status: TaskStatus): void {
    this.statusChange.emit(status);
  }

  deleteTask(): void {
    this.delete.emit(this.task().id);
  }
}