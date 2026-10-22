import { createContext, useContext } from "react";

// Context shape: { status, claims, profile, canEdit, login, logout, refresh }
// - status: "loading" | "authenticated" | "unauthenticated"
// - claims: OIDC user info from the hosted session
// - profile: { userId, email, firstName, lastName, roles } from iam.me() —
//   the IAM record id used to key per-user data; null until it loads
// - canEdit: true only for clouduser — the app's one write key. Every CRUD
//   affordance (CV editing, shelf delete, keyword saves) gates on this, so
//   viewers like the dataviewer role get a strictly read-only app.
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// IAM surfaces roles in several shapes depending on the endpoint — flat slug
// arrays, org-keyed objects ({ "default": ["clouduser"] }), comma-joined
// strings. Normalize every variant to one deduplicated slug array so the
// profile's roles (and canEdit) never silently come out empty — the same
// role can come back once per organization.
export const rolesToSlugs = (roles) => {
  const slugs = [];
  if (typeof roles === "string") {
    slugs.push(...roles.split(",").map((slug) => slug.trim()));
  } else if (Array.isArray(roles)) {
    slugs.push(
      ...roles.map((entry) =>
        typeof entry === "string" ? entry : entry?.slug ?? entry?.name ?? ""
      )
    );
  } else if (roles && typeof roles === "object") {
    slugs.push(
      ...Object.values(roles)
        .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
        .map((entry) =>
          typeof entry === "string" ? entry : entry?.slug ?? entry?.name ?? ""
        )
    );
  }
  return [...new Set(slugs.filter(Boolean))];
};
