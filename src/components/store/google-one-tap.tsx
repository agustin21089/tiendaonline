"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

type GISResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (r: GISResponse) => void;
            cancel_on_tap_outside?: boolean;
            context?: string;
            itp_support?: boolean;
          }) => void;
          prompt: (
            cb?: (n: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// Pages where we should not show One Tap (user is already on auth pages)
const AUTH_PATHS = ["/login", "/registro", "/verificar", "/recuperar"];

export function GoogleOneTap({ clientId }: { clientId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't show if: logged in, loading, or on auth pages
    if (status === "loading") return;
    if (session?.user) return;
    if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return;

    let cancelled = false;
    let scriptEl: HTMLScriptElement | null = null;

    function initOneTap() {
      if (cancelled || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        cancel_on_tap_outside: false,
        context: "signin",
        itp_support: true,
        callback: async ({ credential }: GISResponse) => {
          const result = await signIn("credentials", {
            idToken: credential,
            redirect: false,
          });
          if (result?.ok) {
            router.refresh();
            // Let the router handle the redirect (stay on current page or go to cuenta)
            if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
              router.push("/cuenta");
            }
          }
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap was suppressed (e.g. user dismissed it before) — silent fail
        }
      });
    }

    if (window.google) {
      // Script already loaded (e.g. navigating between pages)
      initOneTap();
    } else {
      scriptEl = document.createElement("script");
      scriptEl.src = "https://accounts.google.com/gsi/client";
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onload = initOneTap;
      document.head.appendChild(scriptEl);
    }

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
      if (scriptEl && document.head.contains(scriptEl)) {
        document.head.removeChild(scriptEl);
      }
    };
  }, [clientId, session, status, router, pathname]);

  return null; // No DOM output — the popup is rendered by Google's SDK
}
