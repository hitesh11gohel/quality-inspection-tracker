import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely.
 * clsx handles conditional class strings; twMerge resolves Tailwind conflicts
 * (e.g. `p-2 p-4` → `p-4`) so the last class always wins.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
