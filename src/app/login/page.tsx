import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { GoogleOneTap } from "@/components/store/google-one-tap";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? null;

  return (
    <>
      {googleClientId && <GoogleOneTap clientId={googleClientId} />}
      <Suspense
        fallback={
          <div className="min-h-screen bg-arena-50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-arena-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </>
  );
}
