import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT"

export interface Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
  }
  expires: string
} 