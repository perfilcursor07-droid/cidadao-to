export interface User {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'editor' | 'admin';
  city?: string;
  verified?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}
