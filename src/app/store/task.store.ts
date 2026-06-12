import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withHooks,
    withMethods,
    withState,
} from '@ngrx/signals';
import { Task, TaskPriority, TaskStatus } from '../models/task.model';
import {
    loadFromLocalStorage,
    saveToLocalStorage,
} from './local-storage.feature';

import { HttpClient } from '@angular/common/http';
import { pipe, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

const STORAGE_KEY = 'task-board-tasks';

type TaskState = {
    tasks: Task[];
    priorityFilter: TaskPriority | 'all';
    isLoading: boolean;
    error: string | null;
};

type DummyTodoDto = {
    id: number;
    todo: string;
    completed: boolean;
    userId: number;
};

type DummyTodosResponseDto = {
    todos: DummyTodoDto[];
    total: number;
    skip: number;
    limit: number;
};

const initialState: TaskState = {
    tasks: [],
    priorityFilter: 'all',
    isLoading: false,
    error: null,
};

function mapDummyTodoToTask(todo: DummyTodoDto): Task {
  return {
    id: String(todo.id),
    title: todo.todo,
    description: `Imported from DummyJSON for user ${todo.userId}`,
    priority: 'medium',
    status: todo.completed ? 'done' : 'todo',
  };
}


function saveTasksToStorage(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export const TaskStore = signalStore(
    { providedIn: 'root' },

    withState(initialState),

    withComputed((store) => {
    const filteredTasks = computed(() => {
    const filter = store.priorityFilter();

    if (filter === 'all') {
      return store.tasks();
    }

    return store.tasks().filter((task) => task.priority === filter);
    });

    return {
        filteredTasks,

        todoTasks: computed(() =>
            filteredTasks().filter((task) => task.status === 'todo'),
    ),

        inProgressTasks: computed(() =>
            filteredTasks().filter((task) => task.status === 'in-progress'),
    ),

        doneTasks: computed(() =>
            filteredTasks().filter((task) => task.status === 'done'),
        ),
    };
    }),

    withMethods((store, http = inject(HttpClient)) => ({
        addTask(data: Omit<Task, 'id' | 'status'>): void {
        const newTask: Task = {
            ...data,
            id: crypto.randomUUID(),
            status: 'todo',
        };

        const updatedTasks = [...store.tasks(), newTask];

        patchState(store, {
            tasks: updatedTasks,
        });

        saveToLocalStorage(STORAGE_KEY, updatedTasks);
        },

        moveTask(id: string, status: TaskStatus): void {
            const updatedTasks = store.tasks().map((task) =>
            task.id === id ? { ...task, status } : task,
        );

        patchState(store, {
            tasks: updatedTasks,
        });

        saveToLocalStorage(STORAGE_KEY, updatedTasks);
        },

        deleteTask(id: string): void {
            const updatedTasks = store.tasks().filter((task) => task.id !== id);

            patchState(store, {
                tasks: updatedTasks,
            });

            saveToLocalStorage(STORAGE_KEY, updatedTasks);
        },

        setPriorityFilter(priority: TaskPriority | 'all'): void {
            patchState(store, {
                priorityFilter: priority,
            });
        },

        loadTasksFromApi: rxMethod<void>(
            pipe(
            tap(() => {
                patchState(store, {
                    isLoading: true,
                    error: null,
                });
            }),
            switchMap(() => http.get<DummyTodosResponseDto>('https://dummyjson.com/todos?limit=10').pipe(
                tapResponse({
                    next: (response) => {
                        const apiTasks = response.todos.map(mapDummyTodoToTask);
                        const localTasks = store.tasks();
                        console.log('API Tasks:', apiTasks);
                        console.log('Local Tasks:', localTasks);

                        const mergedTasks = [
                            ...apiTasks,
                            ...localTasks.filter(
                                (localTask) => !apiTasks.some((apiTask) => apiTask.id === localTask.id),
                            ),
                        ];

                        patchState(store, {
                            tasks: mergedTasks,
                            isLoading: false,
                        });

                        saveToLocalStorage(STORAGE_KEY, mergedTasks);
                    },
                    error: () => {
                        patchState(store, {
                            isLoading: false,
                            error: 'Tasks could not be loaded from API.',
                        });
                    },
                }),
            ),),),
        ),
    })),

    withHooks({
        onInit(store) {
        patchState(store, {
            tasks: loadFromLocalStorage<Task[]>(STORAGE_KEY, []),
        });
        store.loadTasksFromApi();
        },
    }),
);