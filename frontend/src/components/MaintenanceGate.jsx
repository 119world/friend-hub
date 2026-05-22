import { Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultWelcome, listenWelcomeConfig } from "../services/appConfig";

export default function MaintenanceGate({ children }) {
  const [settings, setSettings] = useState(defaultWelcome);

  useEffect(() => listenWelcomeConfig(setSettings), []);

  if (!settings?.maintenanceMode) return children;

  return (
    <main className="app-shell grid min-h-screen place-items-center bg-[#fff7fa] px-6 text-center">
      <section className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-soft">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff0f5] text-[#f72565]">
          <Wrench size={30} />
        </div>
        <h1 className="mt-5 text-2xl font-black">{settings.maintenanceTitle || "Friend Hub is updating"}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-500">
          {settings.maintenanceMessage || "We are polishing the app. Please check again in a few minutes."}
        </p>
        {settings.maintenanceActionUrl && (
          <a href={settings.maintenanceActionUrl} className="pink-gradient mt-5 inline-flex rounded-full px-5 py-3 font-black text-white">
            {settings.maintenanceActionLabel || "Status"}
          </a>
        )}
      </section>
    </main>
  );
}
