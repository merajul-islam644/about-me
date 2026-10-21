import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import mypic from "../../assets/original-profile-picture.png";
import { useAuth } from "../../auth/auth-context";
import { useProfilePicture } from "../../portfolio/useProfilePicture";

// Right-hand card on the Contact tab: uploads this user's profile picture.
// Storage saves instantly — this is independent of the draft/Save flow.
export const ProfilePicSection = () => {
  const { status, profile } = useAuth();
  const { url, uploading, error, upload, pending: picPending } = useProfilePicture(
    profile?.userId,
    status !== "unauthenticated" && !profile,
  );
  const fileInputRef = useRef(null);
  const picture = url ?? mypic;

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be picked again
    if (!file) return;
    await upload(file);
  };

  return (
    <section className="bg-gray-800 border border-white/10 rounded-2xl shadow-xl p-5 md:p-8 flex flex-col items-center text-center gap-4">
      <h3 className="text-lg font-semibold text-gray-200">Profile picture</h3>
      <img
        src={picture}
        alt="Profile"
        className={`w-28 h-28 rounded-full object-cover border-4 border-sky-400 shadow-lg transition ${
          picPending ? "scale-110 blur-xl opacity-60 animate-pulse" : ""
        } ${uploading ? "opacity-50" : ""}`}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-sky-500/10 border border-sky-400/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 disabled:opacity-40 disabled:cursor-wait transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Upload photo
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-400 max-w-[240px]">{error}</p>}
      <p className="text-xs text-gray-500">
        Shows on your Hero and About pages. Saves instantly — no Save needed.
      </p>
    </section>
  );
};
