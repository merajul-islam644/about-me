import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Camera,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { useProfilePicture } from "../portfolio/useProfilePicture";
import visitorAvatar from "../assets/visitor-avatar.jpg";
import { ModeTabs } from "./ModeTabs";

// The signed-in account page, reached from the navbar avatar dropdown.
// Same design language as the CV shelf and Job Alerts — flat gray-900
// page, ModeTabs on top, rounded-2xl gray-800 cards, sky headings.
const linkRowClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-sky-400/40 hover:text-sky-300";

const DetailRow = ({ label, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
    <dt className="text-sm text-gray-400">{label}</dt>
    <dd className="min-w-0 text-sm font-semibold text-gray-100">{children}</dd>
  </div>
);

const ProfilePage = () => {
  const { status, profile, canEdit } = useAuth();  const { url, uploading, error, upload, pending: picPending } = useProfilePicture(
    profile?.userId,
    status !== "unauthenticated" && !profile,
  );
  const fileInputRef = useRef(null);

  // RequireAuth gates the route, so the profile is settled before we render.
  if (!profile?.userId) return null;

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Signed in";
  const email = profile.email ?? "";
  const roles = profile.roles ?? [];
  const picture = url ?? visitorAvatar;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be picked again
    if (!file) return;
    await upload(file);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col bg-gray-900">
      {/* Every page carries the mode switch right under the navbar. */}
      <div className="flex justify-center px-6 pt-6">
        <ModeTabs />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        <header>
          <h2 className="text-3xl font-bold text-sky-400 md:text-4xl">Profile</h2>
          <p className="mt-2 text-sm text-gray-400 md:text-base">
            Your account at a glance — picture, identity and the places you
            build.
          </p>
        </header>

        {/* Identity — avatar with the same upload affordance as the hero. */}
        <section className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-gray-800 p-6 shadow-xl sm:flex-row sm:gap-6">
          <div className="group relative h-28 w-28 shrink-0">
            <img
              src={picture}
              alt="Profile"
              className={`h-full w-full rounded-full border-4 border-sky-400 object-cover shadow-lg transition ${
                picPending ? "scale-110 blur-xl opacity-60 animate-pulse" : ""
              } ${uploading ? "opacity-50" : ""}`}
            />
            {/* ANY signed-in member can set their own face — role-agnostic
                by design: the server's storage permissions decide whether
                the upload lands, and the error below surfaces a refusal. */}
            {status === "authenticated" && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Change profile picture"
                  aria-label="Change profile picture"
                  className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-gray-800 bg-sky-500 text-white shadow-lg transition hover:bg-sky-400 disabled:cursor-wait"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h3 className="truncate text-2xl font-bold text-white">{displayName}</h3>
            {email && <p className="mt-1 truncate text-sm text-gray-400">{email}</p>}
            {error && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Account facts from IAM. */}
        <section className="rounded-2xl border border-white/10 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white">Account details</h3>
          <dl className="mt-2 flex flex-col divide-y divide-white/5">
            <DetailRow label="Full name">{displayName}</DetailRow>
            <DetailRow label="Email">{email || "—"}</DetailRow>
            <DetailRow label="User ID">
              <span className="block truncate font-mono text-xs text-gray-300">
                {profile.userId}
              </span>
            </DetailRow>
            <DetailRow label="Roles">
              {roles.length > 0 ? (
                <span className="flex flex-wrap justify-end gap-1.5 sm:justify-end">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs text-sky-300"
                    >
                      {role}
                    </span>
                  ))}
                </span>
              ) : (
                "—"
              )}
            </DetailRow>
          </dl>
        </section>

        {/* The owner's destinations — editors only. Viewers are here to
            read the showcase, not to navigate the app. */}
        {canEdit && (
          <section className="rounded-2xl border border-white/10 bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white">Where to next</h3>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/profile/access" className={linkRowClass}>
                <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="min-w-0">
                  Team &amp; access
                  <span className="ml-2 font-normal text-gray-500">
                    invite users, shape roles &amp; permissions
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-500" />
              </Link>
              <Link to="/cv/library" className={linkRowClass}>
                <FileText className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="min-w-0">
                  My CV
                  <span className="ml-2 font-normal text-gray-500">
                    every saved resume in one shelf
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-500" />
              </Link>
              <Link to="/cv/jobs" className={linkRowClass}>
                <Bell className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="min-w-0">
                  Job Alerts
                  <span className="ml-2 font-normal text-gray-500">
                    posts matching your keywords
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-500" />
              </Link>
              <Link to="/edit" className={linkRowClass}>
                <Pencil className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="min-w-0">
                  Edit portfolio
                  <span className="ml-2 font-normal text-gray-500">
                    update the public showcase
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-500" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
