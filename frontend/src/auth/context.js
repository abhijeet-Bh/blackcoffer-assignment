// separate context module so AuthProvider exports only a component
import { createContext } from "react";

export const AuthContext = createContext(null);
