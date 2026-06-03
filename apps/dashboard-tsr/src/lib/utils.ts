import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui class-merge helper (clsx + tailwind-merge), matching the Next app's
// lib/utils.ts so ported components keep working unchanged.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
