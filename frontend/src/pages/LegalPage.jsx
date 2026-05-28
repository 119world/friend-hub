import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LEGAL = {
  about: {
    title: "About Us",
    body: "Friend Hub is a social networking platform where users can discover people, chat safely, and build interest-based friendships.\n\nOur purpose is to help adults and eligible users meet new friends, join a safe chat community, and connect with people through interests, location preferences, and community features.\n\nFriend Hub is not an adult, escort, matrimonial, or relationship brokerage service."
  },
  contact: {
    title: "Contact Us",
    body: "Business name: Friend Hub\nSupport email: mdibrahim786d@gmail.com\nWebsite: https://friend-hub-pi.vercel.app"
  },
  privacy: {
    title: "Privacy Policy",
    body: "We protect account, profile, payment, and chat data with secure access controls. We use this information to operate Friend Hub, provide social networking features, process digital credit purchases, support safety moderation, and respond to support requests.\n\nWe do not allow misuse, stalking, scraping, impersonation, fake profiles, scams, harassment, or data abuse."
  },
  terms: {
    title: "Terms & Conditions",
    body: "Friend Hub is for social networking, friendship, and interest-based community use only. Users must be 18+ where required by law.\n\nNo adult content, escort activity, harassment, fake profiles, scams, abusive chat, illegal activity, or attempts to collect private information from other users are allowed.\n\nPayments are collected only for digital credits and premium social networking features such as chat boosts, profile highlights, and premium visibility."
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: "Payments are for digital credits and premium social networking features only. Credits can be used for chat boosts, profile highlights, and premium visibility.\n\nRefund requests are reviewed according to this policy and applicable law. Approved refunds may require payment verification details such as order ID, transaction ID, account email, and payment date. Used digital credits or consumed premium features may not be refundable unless required by law."
  },
  safety: {
    title: "User Safety Policy",
    body: "Users must be 18+ where required. No adult content, harassment, abusive chat, fake profiles, scams, threats, stalking, hate speech, or private-data misuse is allowed.\n\nUsers can report or block harmful behavior. Friend Hub moderation can review reports, restrict features, suspend abusive accounts, and remove unsafe content."
  },
  abuse: {
    title: "Report Abuse Policy",
    body: "Use report and block features for harmful behavior, fake profiles, scams, adult content, harassment, or abusive chat. You can also contact support at mdibrahim786d@gmail.com.\n\nFriend Hub moderation reviews reports and can suspend or remove violating accounts. Emergency or illegal activity should also be reported to local authorities."
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
