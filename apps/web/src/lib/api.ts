const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthInput {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthInput {
  displayName: string;
}

export interface ApiProblem {
  code: string;
  detail: string;
  errors?: Record<string, string[]>;
  requestId?: string;
  status: number;
  title: string;
}

export class ApiError extends Error {
  constructor(public readonly problem: ApiProblem) {
    super(problem.detail);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const problem = (await response.json()) as ApiProblem;
    throw new ApiError(problem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  async currentUser(): Promise<User | null> {
    try {
      const response = await apiRequest<{ data: User }>("/auth/me");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.problem.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async login(input: AuthInput): Promise<User> {
    const response = await apiRequest<{ data: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async register(input: RegisterInput): Promise<User> {
    const response = await apiRequest<{ data: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.data;
  },

  logout(): Promise<void> {
    return apiRequest("/auth/logout", { method: "POST" });
  },
};
