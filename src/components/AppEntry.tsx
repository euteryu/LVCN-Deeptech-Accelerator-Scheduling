import { lazy, Suspense } from "react";
import type { Profile } from "../types";

const App = lazy(() => import("../App"));

function AppLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4]">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-medium text-slate-500">Loading programme board…</p>
      </div>
    </main>
  );
}

export function AppEntry({
  profile,
  productionMode,
}: {
  profile?: Profile;
  productionMode?: boolean;
}) {
  return (
    <Suspense fallback={<AppLoading />}>
      <App initialProfile={profile} productionMode={productionMode} />
    </Suspense>
  );
}
