import { blocksClient } from "./client";

// Access-control admin over the IAM SDK — invites, user lists, role and
// permission management. Every call rides the signed-in admin's own token,
// so an under-permissioned account surfaces as the API's 403, never as a
// silent empty list.

// The SDK throws BlocksApiError (detail in .body) on non-2xx, and a 2xx body
// can still carry isSuccess: false with an errors list — normalize both into
// one readable Error.
function detailOf(error) {
  let text = error?.body?.message || error?.message;
  if (!text && error?.body) {
    text =
      typeof error.body === "string"
        ? error.body
        : JSON.stringify(error.body).slice(0, 300);
  }
  return text || "unknown error";
}

function errorsText(response) {
  const errors = response?.errors;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) {
    return errors
      .map((entry) =>
        typeof entry === "string" ? entry : entry?.message || entry?.description
      )
      .filter(Boolean)
      .join(", ");
  }
  return response?.message;
}

async function call(operation, run) {
  try {
    const response = await run();
    if (response?.isSuccess === false) {
      throw new Error(errorsText(response) || "the request was rejected");
    }
    return response;
  } catch (error) {
    throw new Error(`${operation} failed: ${detailOf(error)}`);
  }
}

export async function listUsers({ pageNo = 1, pageSize = 20, search = "" } = {}) {
  const response = await call("Listing users", () =>
    blocksClient.iam.users.list({ pageNo, pageSize, search: search || undefined })
  );
  const users = Array.isArray(response?.data) ? response.data : [];
  return { users, totalCount: response?.totalCount ?? users.length };
}

export async function checkEmailAvailable(email) {
  const response = await call("Email check", () =>
    blocksClient.iam.users.emailAvailable({ email })
  );
  return response?.isAvailable ?? response?.IsAvailable ?? true;
}

export async function inviteUser({ email, firstName, lastName, roles = [] }) {
  return call("Invite", async () => {
    // users.create returns no id and its inline roles land in one
    // organization only — create the account bare, find the fresh record
    // by email, then attach the roles to both organizations. The found
    // record comes back so callers can key per-user settings (like the
    // shared-CV pick) to the new account.
    await blocksClient.iam.users.create({ email, firstName, lastName });
    const { users } = await listUsers({ search: email });
    const created =
      users.find(
        (user) => (user.email || "").toLowerCase() === email.toLowerCase()
      ) ?? null;
    if (roles.length) {
      if (!created?.itemId) {
        throw new Error(
          "the account was created, but attaching its roles failed — set them from the Users tab"
        );
      }
      await blocksClient.iam.users.updateAccess({
        userId: created.itemId,
        roles,
        organizationId: PROJECT_ORG_ID,
      });
      await blocksClient.iam.users.updateAccess({ userId: created.itemId, roles });
    }
    return created;
  });
}

export async function activateUser(userId) {
  await call("Activation", () => blocksClient.iam.users.activate({ userId }));
}

export async function deactivateUser(userId) {
  await call("Deactivation", () => blocksClient.iam.users.deactivate({ userId }));
}

// Invited users' sessions resolve their roles against the project
// organization, while an org-less access write lands in "default" — the
// split that left a freshly invited viewer's profile showing no roles.
// Role writes therefore go to BOTH organizations; each write replaces only
// its own organization's list.
export const PROJECT_ORG_ID = "77a8fb25-2bee-4eb5-9fa3-d41c78c4d723";

// The roles array REPLACES the user's role set in each organization —
// callers must send the complete list the user should end up with.
export async function setUserRoles({ userId, roles }) {
  await call("Role update", async () => {
    await blocksClient.iam.users.updateAccess({
      userId,
      roles,
      organizationId: PROJECT_ORG_ID,
    });
    await blocksClient.iam.users.updateAccess({ userId, roles });
  });
}

export async function listRoles() {
  const response = await call("Listing roles", () =>
    blocksClient.iam.roles.list({ pageNo: 1, pageSize: 100 })
  );
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createRole({ name, slug, description = "" }) {
  await call("Role creation", () =>
    blocksClient.iam.roles.create({ name, slug, description })
  );
}

export async function listPermissions({ pageNo = 1, pageSize = 200, search = "" } = {}) {
  const response = await call("Listing permissions", () =>
    blocksClient.iam.permissions.list({ pageNo, pageSize, search: search || undefined })
  );
  const permissions = Array.isArray(response?.data) ? response.data : [];
  return { permissions, totalCount: response?.totalCount ?? permissions.length };
}

// add/remove carry permission itemIds (not resource strings) keyed by the
// role slug — the call is a delta, not a full-set replace.
export async function assignRolePermissions({ slug, addPermissions, removePermissions }) {
  await call("Permission update", () =>
    blocksClient.iam.roles.assignPermissions({ slug, addPermissions, removePermissions })
  );
}
