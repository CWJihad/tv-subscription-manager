export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}