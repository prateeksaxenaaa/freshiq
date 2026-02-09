import { useCallback, useRef } from 'react';

/**
 * Generic debounced autosave hook
 * 
 * Usage:
 *   const debouncedUpdate = useAutosave(updateMutation, 500);
 *   debouncedUpdate({ id: '123', title: 'New Title' });
 * 
 * @param mutationFn - The mutation function to call
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 */
export function useAutosave<T>(
    mutationFn: (data: T) => void | Promise<void>,
    delay: number = 500
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedFn = useCallback(
        (data: T) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                mutationFn(data);
            }, delay);
        },
        [mutationFn, delay]
    );

    return debouncedFn;
}
