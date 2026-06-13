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

type DummyMutationResponseDto = {
    id: number;
    todo: string;
    completed: boolean;
    userId?: number;
    isDeleted?: boolean;
    deletedOn?: string;
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

function mapTaskToDummyTodoPayload(task: Task): {
    todo: string;
    completed: boolean;
    userId: number;
} {
    return {
        todo: task.title,
        completed: task.status === 'done',
        userId: 1,
    };
}

function isDummyJsonTaskId(id: string): boolean {
    return /^\d+$/.test(id);
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

        createTaskOnApi: rxMethod<Task>(
            pipe(
                switchMap((task) =>
                http.post<DummyMutationResponseDto>('https://dummyjson.com/todos/add',
                mapTaskToDummyTodoPayload(task),
                ).pipe(
                tapResponse({
                    next: () => {
                        console.log('Task creation simulated on API for task:', task);
                    },
                    error: () => {
                        patchState(store, {
                        error: 'Task could not be created on API.',
                        });
                    },
                }),),
                ),
            ),
        ),

        updateTaskOnApi: rxMethod<Task>(
            pipe(
                switchMap((task) =>
                http.put<DummyMutationResponseDto>(`https://dummyjson.com/todos/${task.id}`,
                mapTaskToDummyTodoPayload(task),
                ).pipe(
                tapResponse({
                    next: () => {
                        console.log('Task update simulated on API for task:', task);
                    },
                    error: () => {
                        patchState(store, {
                            error: 'Task could not be updated on API.',
                        });
                    },
                }),),),
            ),
        ),

        deleteTaskFromApi: rxMethod<string>(
        pipe(
            switchMap((id) =>
            http.delete<DummyMutationResponseDto>(`https://dummyjson.com/todos/${id}`,
            ).pipe(
            tapResponse({
                next: () => {
                    console.log('Task deletion simulated on API for task ID:', id);
                },
                error: () => {
                    patchState(store, {
                        error: 'Task could not be deleted on API.',
                    });
                },
            }),),),
        ),),


    })),
    withMethods((store) => ({
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
        store.createTaskOnApi(newTask);
        },

        moveTask(id: string, status: TaskStatus): void {
            const updatedTasks = store.tasks().map((task) =>
            task.id === id ? { ...task, status } : task,
        );

        const updatedTask = updatedTasks.find((task) => task.id === id);

        patchState(store, {
            tasks: updatedTasks,
        });

        saveToLocalStorage(STORAGE_KEY, updatedTasks);
        if (updatedTask && isDummyJsonTaskId(updatedTask.id)) {
            store.updateTaskOnApi(updatedTask);
        }
        },

        deleteTask(id: string): void {
            const updatedTasks = store.tasks().filter((task) => task.id !== id);

            patchState(store, {
                tasks: updatedTasks,
            });

            saveToLocalStorage(STORAGE_KEY, updatedTasks);
            if (isDummyJsonTaskId(id)) {
                store.deleteTaskFromApi(id);
            }
        },

        setPriorityFilter(priority: TaskPriority | 'all'): void {
            patchState(store, {
                priorityFilter: priority,
            });
        },


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