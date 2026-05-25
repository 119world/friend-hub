import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LEGAL = {
  about: {
    title: "About Us",
    body: "Friend Hub is a friendship platform and social networking community where people connect through shared interests and safe conversations."
  },
  contact: {
    title: "Contact Us",
    body: "Business name: Friend Hub\nSupport email: mdibrahim786d@gmail.com\nWebsite: https://friend-hub-pi.vercel.app"
  },
  privacy: {
    title: "Privacy Policy",
    body: "We protect account, profile, and chat data with secure access controls. We do not allow misuse, stalking, or data abuse."
  },
  terms: {
    title: "Terms & Conditions",
    body: "Friend Hub is for social networking and friendship use only. Adult, escort, harassment, fake-profile, and scam activities are prohibited."
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: "Payments are for digital credits and premium social networking features. Refund requests are reviewed according to our refund policy."
  },
  safety: {
    title: "User Safety Policy",
    body: "Users must be 18+ where required. No adult content, harassment, abusive chat, or scams. Users can report/block and admins can suspend abusive accounts."
  },
  abuse: {
    title: "Report Abuse Policy",
    body: "Use report and block features for harmful behavior. Friend Hub moderation reviews reports and can suspend or remove violating accounts."
  }
};

export default function LegalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const slug = location.pathname.replace("/", "") || "about";
  const item = useMemo(() => LEGAL[slug] || LEGAL.about, [slug]);

  return (
    <section className="phone-page px-5 pt-4 pb-28">
      <header className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-full bg-zinc-100 p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black">{item.title}</h1>
      </header>
      <article className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-medium leading-6 text-zinc-700 whitespace-pre-line">
        {item.body}
      </article>
      <p className="mt-4 text-center text-xs font-semibold text-zinc-500">
        Friend Hub is a social networking and friendship platform. It is not an adult, escort, or matrimonial service.
      </p>
    </section>
  );
}
