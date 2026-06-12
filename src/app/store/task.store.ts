import { computed } from '@angular/core';
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


const STORAGE_KEY = 'task-board-tasks';

type TaskState = {
    tasks: Task[];
    priorityFilter: TaskPriority | 'all';
};

const initialState: TaskState = {
    tasks: [],
    priorityFilter: 'all',
};



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
    })),

    withHooks({
        onInit(store) {
        patchState(store, {
            tasks: loadFromLocalStorage<Task[]>(STORAGE_KEY, []),
        });
        },
    }),
);