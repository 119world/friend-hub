import { useEffect, useMemo, useState } from "react";
import { getPublicProfilesState, listenPublicProfilesState } from "../services/appConfig";

const initialState = {
  profiles: [],
  status: "loading",
  error: "",
  source: "network",
  updatedAt: 0,
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  isRefreshing: false
};

export function usePublicProfiles() {
  const [state, setState] = useState(() => getPublicProfilesState?.() || initialState);

  useEffect(() => listenPublicProfilesState(setState), []);

  return useMemo(() => ({
    ...state,
    hasProfiles: state.profiles.length > 0,
    isInitialLoading: state.status === "loading" && !state.profiles.length,
    hasCachedProfiles: state.source === "cache" && state.profiles.length > 0
  }), [state]);
}
