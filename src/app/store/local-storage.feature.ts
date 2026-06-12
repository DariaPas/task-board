export function loadFromLocalStorage<T>(key: string, fallback: T): T {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
        return fallback;
    }

    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return fallback;
    }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}