export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}
