import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { InputFallback } from "./input-fallback";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Profile } from "../types";

type AccessRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: Profile["role"];
  organisation_id: string | null;
};

export function AuthGate({
  children,
}: {
  children: (profile?: Profile, productionMode?: boolean) => ReactNode;
}) {
  const demoMode =
    import.meta.env.VITE_DEMO_MODE !== "false" || !isSupabaseConfigured;
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>();
  const [ready, setReady] = useState(demoMode);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const client = supabase;
    if (demoMode || !client) return;
    const loadProfile = async (nextSession: Session | null) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(undefined);
        setReady(true);
        return;
      }
      const { data } = await client
        .from("profiles")
        .select("id,email,full_name,role,organisation_id")
        .eq("id", nextSession.user.id)
        .maybeSingle();
      if (!data) {
        setProfile(undefined);
        setReady(true);
        return;
      }
      setProfile({
        id: data.id,
        email: data.email,
        fullName: data.full_name ?? data.email,
        role: data.role,
        organisationId: data.organisation_id ?? undefined,
      });
      setReady(true);
    };
    void client.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: listener } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        void loadProfile(nextSession);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [demoMode]);

  // A profile held in React state is not enough to authorise REST requests.
  // If a browser has lost its Supabase session, the client falls back to the
  // public key and every RLS-protected request returns 401. Reconcile on focus
  // so the user is returned to the access screen instead of seeing an empty
  // programme board.
  useEffect(() => {
    const client = supabase;
    if (demoMode || !client) return;
    const verifySession = async () => {
      const { data } = await client.auth.getSession();
      if (data.session?.access_token) return;
      setSession(null);
      setProfile(undefined);
      setReady(true);
    };
    void verifySession();
    window.addEventListener("focus", verifySession);
    return () => window.removeEventListener("focus", verifySession);
  }, [demoMode]);

  if (demoMode) return children(undefined, false);
  if (!ready)
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Preparing access…</p>
        </div>
      </AuthShell>
    );
  if (session && profile) return children(profile, true);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    const email = String(new FormData(event.currentTarget).get("email"))
      .trim()
      .toLowerCase();
    const client = supabase!;
    let activeSession = (await client.auth.getSession()).data.session;
    if (!activeSession) {
      const { data, error: anonymousError } =
        await client.auth.signInAnonymously();
      if (anonymousError || !data.session) {
        setError(anonymousError?.message ?? "Could not start access session");
        return;
      }
      activeSession = data.session;
    }
    const { data, error: accessError } = await client.rpc(
      "claim_quick_access",
      { access_email: email },
    );
    const access = (data as AccessRow[] | null)?.[0];
    if (accessError || !access) {
      setError(
        accessError?.message ?? "This email is not on the LVCN allow-list.",
      );
      return;
    }
    setSession(activeSession);
    setProfile({
      id: access.id,
      email: access.email,
      fullName: access.full_name ?? access.email,
      role: access.role,
      organisationId: access.organisation_id ?? undefined,
    });
  };

  return (
    <AuthShell>
      <div className="flex items-center gap-3">
        <img
          src="/lvcn_logo.webp"
          alt="LVCN"
          className="size-11 rounded-xl object-contain"
        />
        <div>
          <p className="font-bold">LVCN</p>
          <p className="text-xs text-slate-500">Programme board</p>
        </div>
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">
        Deeptech Accelerator Schedule
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Enter the email address you provided to LVCN during correspondence.
      </p>
      <form className="mt-7" onSubmit={signIn}>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Registered email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 size-4 text-slate-400" />
          <InputFallback
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="pl-9"
          />
        </div>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        <Button type="submit" variant="indigo" className="mt-4 w-full">
          Open programme board <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f5f1] p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-9">
        {children}
      </div>
    </main>
  );
}
