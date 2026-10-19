import { createContext, useContext } from "react";

// Context shape: { status, claims, profile, login, logout, refresh }
// - status: "loading" | "authenticated" | "unauthenticated"
// - claims: OIDC user info from the hosted session
// - profile: { userId, email, firstName, lastName, roles } from iam.me() —
//   the IAM record id used to key per-user data; null until it loads
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
