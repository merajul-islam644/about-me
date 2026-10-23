import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { storeGuestToken } from "../lib/blocks/invites";

// The last hop of a guest link: park the token where the portfolio provider
// picks it up (effects run child-first, so this lands before the provider's
// load), then hand the visitor to the showcase it unlocks. Nothing renders
// here beyond a beat of spinner.
const InviteLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const clean = String(token ?? "").trim();
    if (clean) storeGuestToken(clean);
    navigate("/", { replace: true });
  }, [token, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
    </div>
  );
};

export default InviteLanding;
