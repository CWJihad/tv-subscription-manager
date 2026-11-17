export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}

/** GET /users/self/in */
export interface SelfUser {
  id: string;
  fullName: string;
  email: string;
}

export interface UpdateSelfInput {
  fullName?: string;
  email?: string;
}

/** POST /auth/change-password body */
export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordFormValues {
  current: string;
  next: string;
  confirm: string;
}

export interface ChangePasswordFormErrors {
  current?: string | undefined;
  next?: string | undefined;
  confirm?: string | undefined;
}