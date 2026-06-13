# Task Board

A small Angular task board application.

The app allows users to create tasks, move them between columns, filter them by priority, persist tasks locally, and load initial tasks from the DummyJSON API.

## Tech Stack

- Angular 20
- Standalone Components
- Angular Signals
- New Angular template syntax: `@if`, `@for`, `@defer`
- NgRx SignalStore
- RxJS interop with `rxMethod`
- DummyJSON API
- `localStorage` persistence
- Playwright E2E tests

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open the app:

```text
http://localhost:4200
```

Run a production build:

```bash
npm run build
```

Run E2E tests:

```bash
npm run e2e
```

## Features

- Create new tasks
- Move tasks between `To Do`, `In Progress`, and `Done`
- Delete tasks
- Filter tasks by priority
- Persist tasks in `localStorage`
- Load tasks from the DummyJSON API
- Show loading and error states for API requests
- Lazy-load the task form with `@defer`

## Architecture

The application uses a simple component structure:

```text
App
└── TaskBoard
    ├── TaskColumn
    │   └── TaskCard
    └── TaskForm
```

`TaskBoard` acts as the container component and connects the UI to the `TaskStore`.

State management is handled with NgRx SignalStore. The store contains the task list, loading state, error state, and priority filter.

The store keeps one main task list. The visible column lists (`todoTasks`, `inProgressTasks`, and `doneTasks`) are derived from this list with computed signals, so they update automatically whenever the task state changes.

The UI uses signal inputs and outputs for component communication. Data flows down through inputs, and events such as creating, moving, and deleting tasks flow up through outputs.

## API and Persistence

Initial tasks are loaded from the DummyJSON API using Angular `HttpClient`, `rxMethod`, and `tapResponse`.

When a task is created, moved, or deleted, the app updates the local store immediately and saves the new task list to `localStorage`. The DummyJSON mutation endpoints are called afterwards for demonstration purposes.

DummyJSON mutation endpoints are called for demonstration purposes, but DummyJSON does not persist changes permanently on the server.

## Testing

The project includes Playwright E2E tests covering:

- Column rendering
- Task creation
- Moving tasks between columns
- Priority filtering
- `localStorage` persistence
- API loading
- Loading state
- API error handling
