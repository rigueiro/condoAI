import { createContext } from "react";

export interface User {
  id?: number;
  name: string;
  email: string;
  rememberMe?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register?: (name: string, email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
