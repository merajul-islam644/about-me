import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth, rolesToSlugs } from "../auth/auth-context";
import { ModeTabs } from "./ModeTabs";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import {
  activateUser,
  assignRolePermissions,
  checkEmailAvailable,
  createRole,
  deactivateUser,
  inviteUser,
  listPermissions,
  listRoles,
  listUsers,
  setUserRoles,
} from "../lib/blocks/iam";

// Access control, reached from the Profile page: invite users into the
// tenant and shape the roles & permissions they get — the same IAM admin
// surface the portal offers, driven through blocksClient.iam with the
// signed-in admin's own authority.

const PAGE_SIZE = 20;
const PERMS_PAGE_SIZE = 200;

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-sky-400 focus:outline-none";
const pillButtonClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:border-sky-400/50 hover:text-sky-300";
const primaryButtonClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60";
const ghostButtonClass =
  "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-100";

const PERMISSION_TYPE_LABELS = {
  1: "API",
  2: "UI",
  3: "Data",
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugOfRole = (entry) =>
  typeof entry === "string"
    ? entry
    : (entry?.slug ?? entry?.itemId ?? entry?.name ?? "");

const nameOfRole = (entry) =>
  typeof entry === "string" ? entry : (entry?.name ?? entry?.slug ?? "");

const userName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "Unnamed user";

// IAM returns a user's roles in different shapes (see rolesToSlugs) — the
// list endpoint nests slug arrays under organization keys.
const roleSlugsOf = (user) => rolesToSlugs(user?.roles);

// The row avatar doubles as the upload door: the owner sets ANY member's
// picture right from this list. The hook uploads under that user's own id —
// the file lands on their name in the shared profile folder, and the shared
// picture cache lights their face up everywhere it renders.
const UserAvatar = ({ user }) => {
  const { url, uploading, error, upload } = useProfilePicture(user.itemId);
  const inputRef = useRef(null);
  const initials = userName(user)
    .replace(/[^a-zA-Z ]/g, "")
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !user.itemId}
        title={
          error
            ? `Upload failed — ${error}`
            : `Upload a profile picture for ${userName(user)}`
        }
        aria-label={`Upload profile picture for ${userName(user)}`}
        className={`group relative block h-10 w-10 cursor-pointer overflow-hidden rounded-full border bg-gray-700 transition-colors hover:border-sky-400/50 disabled:cursor-wait ${
          error ? "border-red-400/60" : "border-white/10"
        }`}
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
            {initials || <User className="h-4 w-4" />}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
            <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          </span>
        )}
        {!uploading && (
          <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-gray-900">
            <Camera className="h-2.5 w-2.5 text-gray-400" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // picking the same file again still fires
          if (file) await upload(file);
        }}
      />
    </div>
  );
};

const Modal = ({ title, subtitle, onClose, children, wide = false }) => {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
      />
      <div
        className={`relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const RoleCheckbox = ({ role, checked, onToggle }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-2.5 transition-colors hover:border-sky-400/40">
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onToggle(role.slug)}
      className="h-4 w-4 accent-sky-500"
    />
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold text-gray-100">{role.name}</span>
      <span className="block truncate font-mono text-xs text-gray-500">{role.slug}</span>
    </span>
  </label>
);

const InviteModal = ({ roles, onClose, onInvited }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (slug) =>
    setPicked((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const trimmed = email.trim();
      const available = await checkEmailAvailable(trimmed);
      if (!available) {
        throw new Error("This email already has an account in this project.");
      }
      await inviteUser({
        email: trimmed,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roles: picked,
      });
      onInvited(trimmed);
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Invite a user"
      subtitle="Provisions an IAM account in this project with the roles you pick."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-400">First name *</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              autoFocus
              placeholder="Jane"
              aria-label="First name"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-400">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Doe"
              aria-label="Last name"
              className={fieldClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-400">Email *</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="jane@example.com"
            aria-label="Email"
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-400">Roles</span>
          {roles.length > 0 ? (
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <RoleCheckbox
                  key={role.slug}
                  role={role}
                  checked={picked.includes(role.slug)}
                  onToggle={toggle}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No roles exist yet — create one from the Roles &amp; permissions
              tab, or invite now and set roles later from the list.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Send invite
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Replaces the user's whole role set — every role that exists shows here:
// the ones the user already holds come in ticked, the rest as empty
// checkboxes. Roles outside the list (a system role the API doesn't return,
// say) ride along untouched so saving can't silently strip them. Role
// creation lives in the "Roles & permissions" tab, never in here.
const UserRolesModal = ({ user, roles, onClose, onSaved }) => {
  const userSlugs = roleSlugsOf(user);
  const locked = userSlugs.filter(
    (slug) => !roles.some((role) => role.slug === slug)
  );
  const [picked, setPicked] = useState(
    userSlugs.filter((slug) => roles.some((role) => role.slug === slug))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (slug) =>
    setPicked((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await setUserRoles({ userId: user.itemId, roles: [...locked, ...picked] });
      onSaved();
    } catch (saveError) {
      setError(saveError.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Roles — ${userName(user)}`}
      subtitle="Saving replaces this user's role set in this organization."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {locked.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-gray-800 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400">Kept as-is (outside your assignable set)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {locked.map((slug) => (
                <span key={slug} className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs text-gray-300">
                  {slug}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="text-xs font-semibold text-gray-400">Roles</span>
        {roles.length > 0 ? (
          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <RoleCheckbox
                key={role.slug}
                role={role}
                checked={picked.includes(role.slug)}
                onToggle={toggle}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No roles have been created yet — create one from the Roles &amp;
            permissions tab.
          </p>
        )}

        <p className="text-xs text-gray-500">
          This user ends up with:{" "}
          <span className="font-semibold text-gray-300">
            {[...locked, ...picked].join(", ") || "no roles"}
          </span>
        </p>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || (locked.length === 0 && picked.length === 0)}
            className={primaryButtonClass}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save roles
          </button>
        </div>
      </div>
    </Modal>
  );
};

const UsersTab = ({ roles, meId, refreshRoles }) => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesFor, setRolesFor] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const confirmTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listUsers({ pageNo: page, pageSize: PAGE_SIZE, search: query });
      setUsers(result.users);
      setTotal(result.totalCount);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      clearTimeout(confirmTimer.current);
    },
    []
  );

  const armConfirm = (id) => {
    setConfirmId(id);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
  };

  const toggleActive = async (user) => {
    setBusyId(user.itemId);
    setError("");
    setNotice("");
    try {
      if (user.active === false) {
        await activateUser(user.itemId);
        setNotice(`${userName(user)} reactivated.`);
      } else {
        await deactivateUser(user.itemId);
        setNotice(`${userName(user)} deactivated — sign-in is blocked, the record stays.`);
      }
      setConfirmId(null);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={applySearch} className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <button type="submit" className={pillButtonClass}>
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCreateOpen(true)} className={pillButtonClass}>
            <ShieldCheck className="h-4 w-4" />
            New role
          </button>
          <button type="button" onClick={() => setInviteOpen(true)} className={primaryButtonClass}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">
            No users found{query ? ` for “${query}”` : ""}.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {users.map((user) => (
              <li key={user.itemId ?? user.email} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-100">
                    {userName(user)}
                    {user.itemId === meId && (
                      <span className="ml-2 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-300">
                        you
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(() => {
                      const slugs = roleSlugsOf(user);
                      return slugs.length > 0 ? (
                        slugs.map((slug) => (
                          <span key={slug} className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                            {slug}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-600">no roles</span>
                      );
                    })()}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.active === false
                      ? "bg-red-400/10 text-red-300"
                      : "bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  {user.active === false ? "Inactive" : "Active"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRolesFor(user)}
                    className={pillButtonClass}
                  >
                    Roles
                  </button>
                  {user.itemId !== meId && (
                    <button
                      type="button"
                      onClick={() =>
                        confirmId === user.itemId
                          ? toggleActive(user)
                          : armConfirm(user.itemId)
                      }
                      disabled={busyId === user.itemId}
                      className={
                        confirmId === user.itemId
                          ? "cursor-pointer rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-wait"
                          : "cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:cursor-wait"
                      }
                    >
                      {busyId === user.itemId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.active === false ? (
                        confirmId === user.itemId ? (
                          "Confirm activate?"
                        ) : (
                          "Activate"
                        )
                      ) : confirmId === user.itemId ? (
                        "Confirm deactivate?"
                      ) : (
                        "Deactivate"
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className={pillButtonClass}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
            disabled={page >= lastPage || loading}
            className={pillButtonClass}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {createOpen && (
        <CreateRoleModal
          onClose={() => setCreateOpen(false)}
          onCreated={(name) => {
            setCreateOpen(false);
            setNotice(`Role “${name}” created — it now appears in the role pickers.`);
            refreshRoles();
          }}
        />
      )}
      {inviteOpen && (
        <InviteModal
          roles={roles}
          onClose={() => setInviteOpen(false)}
          onInvited={(email) => {
            setInviteOpen(false);
            setNotice(`Account provisioned for ${email}. If they can't sign in right away, activate them from the list.`);
            setPage(1);
            setQuery("");
            load();
          }}
        />
      )}
      {rolesFor && (
        <UserRolesModal
          user={rolesFor}
          roles={roles}
          onClose={() => setRolesFor(null)}
          onSaved={() => {
            setRolesFor(null);
            setNotice(`${userName(rolesFor)}'s roles updated.`);
            load();
          }}
        />
      )}
    </section>
  );
};

const CreateRoleModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changeName = (value) => {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createRole({
        name: name.trim(),
        slug: slugify(slug) || slugify(name),
        description: description.trim(),
      });
      onCreated(name.trim(), slugify(slug) || slugify(name));
    } catch (createError) {
      setError(createError.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Create a role"
      subtitle="A named bundle of permissions you can then hand to users."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-400">Name *</span>
          <input
            type="text"
            value={name}
            onChange={(event) => changeName(event.target.value)}
            required
            autoFocus
            placeholder="Content editor"
            aria-label="Role name"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-400">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            placeholder="content-editor"
            aria-label="Role slug"
            className={`${fieldClass} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-400">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="What this role is for"
            aria-label="Role description"
            className={`${fieldClass} resize-none`}
          />
        </label>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create role
          </button>
        </div>
      </form>
    </Modal>
  );
};

// The permission picker: checkboxes reflect the role's current membership
// (permission.roles[] lists the roles holding it); Save sends only the delta
// as add/remove itemIds after the admin explicitly clicks Save.
const PermissionsModal = ({ role, onClose, onSaved }) => {
  const [perms, setPerms] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listPermissions({
        pageNo: page,
        pageSize: PERMS_PAGE_SIZE,
        search: query,
      });
      setPerms((current) =>
        page === 1 ? result.permissions : [...current, ...result.permissions]
      );
      setTotal(result.totalCount);
      setPicked((current) => {
        const next = page === 1 ? new Set() : new Set(current);
        result.permissions.forEach((perm) => {
          if (Array.isArray(perm.roles) && perm.roles.includes(role.slug) && perm.itemId) {
            next.add(perm.itemId);
          }
        });
        return next;
      });
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, role.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const delta = { add: [], remove: [] };
  perms.forEach((perm) => {
    if (!perm.itemId) return;
    const held = Array.isArray(perm.roles) && perm.roles.includes(role.slug);
    const checkedNow = picked.has(perm.itemId);
    if (checkedNow && !held) delta.add.push(perm.itemId);
    if (!checkedNow && held) delta.remove.push(perm.itemId);
  });

  const toggle = (id) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await assignRolePermissions({
        slug: role.slug,
        addPermissions: delta.add,
        removePermissions: delta.remove,
      });
      onSaved(delta);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <Modal
      title={`Permissions — ${role.name}`}
      subtitle="Tick what this role should hold, then Save sends just the change."
      onClose={onClose}
      wide
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={applySearch} className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search permissions"
              aria-label="Search permissions"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <button type="submit" className={pillButtonClass}>
            Search
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {loading && page === 1 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading permissions…
          </div>
        ) : perms.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No permissions found.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5 rounded-xl border border-white/10">
            {perms.map((perm) => {
              const id = perm.itemId;
              const held = Array.isArray(perm.roles) && perm.roles.includes(role.slug);
              const checkedNow = id ? picked.has(id) : held;
              return (
                <li key={id ?? perm.resource}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
                    <input
                      type="checkbox"
                      checked={checkedNow}
                      onChange={() => id && toggle(id)}
                      disabled={!id}
                      className="mt-0.5 h-4 w-4 accent-sky-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-100">
                        {perm.name ?? perm.resource ?? "Unnamed permission"}
                      </span>
                      {perm.description && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                          {perm.description}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono text-xs text-gray-500">{perm.resource}</span>
                      {PERMISSION_TYPE_LABELS[perm.type] && (
                        <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                          {PERMISSION_TYPE_LABELS[perm.type]}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {perms.length < total && (
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={loading}
            className={pillButtonClass}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Load more ({total - perms.length} left)
          </button>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-gray-500">
            Change:{" "}
            <span className="font-semibold text-emerald-300">+{delta.add.length}</span>{" "}
            <span className="font-semibold text-red-300">−{delta.remove.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={ghostButtonClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || (delta.add.length === 0 && delta.remove.length === 0)}
              className={primaryButtonClass}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save permissions
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const RolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [permFor, setPermFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRoles(await listRoles());
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Roles bundle permissions; users hold roles.
        </p>
        <button type="button" onClick={() => setCreateOpen(true)} className={primaryButtonClass}>
          <ShieldCheck className="h-4 w-4" />
          Create role
        </button>
      </div>

      {notice && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gray-800 px-6 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {roles.map((role) => (
            <article
              key={role.itemId ?? role.slug}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-gray-800 px-5 py-4 shadow-xl"
            >
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-white">{role.name ?? role.slug}</h4>
                <p className="truncate font-mono text-xs text-gray-500">{role.slug}</p>
                {role.description && (
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">{role.description}</p>
                )}
              </div>
              <button type="button" onClick={() => setPermFor(role)} className={pillButtonClass}>
                Permissions
              </button>
            </article>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateRoleModal
          onClose={() => setCreateOpen(false)}
          onCreated={(name) => {
            setCreateOpen(false);
            setNotice(`Role “${name}” created — open its Permissions to grant access.`);
            load();
          }}
        />
      )}
      {permFor && (
        <PermissionsModal
          role={permFor}
          onClose={() => setPermFor(null)}
          onSaved={(delta) => {
            setPermFor(null);
            setNotice(
              `“${permFor.name}” updated: +${delta.add.length} −${delta.remove.length} permissions.`
            );
          }}
        />
      )}
    </section>
  );
};

const AccessControlPage = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState("users");
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [roles, setRoles] = useState([]);
  const [bootAttempt, setBootAttempt] = useState(0);

  // The role pickers list every role that exists — the admin curates them in
  // the Roles tab (the assignable-roles endpoint came back EMPTY for this
  // account, which had left the pickers blank). Loading them at boot doubles
  // as the 403 gate: an account without IAM read never gets past here.
  const loadRoles = useCallback(async () => {
    setBootError("");
    try {
      const list = await listRoles();
      setRoles(
        list
          .map((entry) => ({
            slug: slugOfRole(entry),
            name: nameOfRole(entry) || slugOfRole(entry),
          }))
          .filter((role) => role.slug)
      );
    } catch (bootFailure) {
      setBootError(bootFailure.message);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    setBooting(true);
    loadRoles();
  }, [loadRoles, bootAttempt]);

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col bg-gray-900">
      <div className="flex justify-center px-6 pt-6">
        <ModeTabs />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <header>
          <h2 className="text-3xl font-bold text-sky-400 md:text-4xl">Team &amp; access</h2>
          <p className="mt-2 text-sm text-gray-400 md:text-base">
            Invite people into this project and control exactly what their
            roles let them see and do.
          </p>
        </header>

        {booting ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gray-800 px-6 py-10 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your access…
          </div>
        ) : bootError ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-6">
            <p className="text-sm font-semibold text-red-300">
              This account can't open access control.
            </p>
            <p className="text-sm text-red-200/80">{bootError}</p>
            <button
              type="button"
              onClick={() => setBootAttempt((current) => current + 1)}
              className={pillButtonClass}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="flex gap-1 rounded-full border border-white/10 bg-gray-800 p-1">
                {[
                  { key: "users", label: "Users" },
                  { key: "roles", label: "Roles & permissions" },
                ].map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setTab(entry.key)}
                    className={
                      tab === entry.key
                        ? "cursor-pointer rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white"
                        : "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-100"
                    }
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>

            {tab === "users" ? (
              <UsersTab
                roles={roles}
                meId={profile?.userId}
                refreshRoles={loadRoles}
              />
            ) : (
              <RolesTab />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccessControlPage;
