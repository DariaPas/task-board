import { Component, input, output } from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-task-column',
  imports: [TaskCard],
  templateUrl: './task-column.html',
  styleUrl: './task-column.css',
})
export class TaskColumn {
  title = input.required<string>();
  status = input.required<TaskStatus>();
  tasks = input.required<Task[]>();

  statusChange = output<{ id: string; status: TaskStatus }>();
  delete = output<string>();

  onStatusChange(taskId: string, status: TaskStatus): void {
    this.statusChange.emit({ id: taskId, status });
  }

  onDelete(taskId: string): void {
    this.delete.emit(taskId);
  }
}