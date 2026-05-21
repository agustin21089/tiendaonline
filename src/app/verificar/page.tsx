"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, resendVerification } from "@/app/registro/actions";
import { Button } from "@/components/ui/button";
import { Store, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    const full = code.join("");
    if (full.length === 6) handleVerify(full);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function handleInput(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  }

  async function handleVerify(fullCode: string) {
    if (loading || fullCode.length < 6) return;
    setLoading(true);
    const result = await verifyEmail(email, fullCode);
    if (result.error) {
      toast.error(result.error);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setLoading(false);
      return;
    }
    setVerified(true);
    // Sign in automatically after verification
    await signIn("credentials", {
      email,
      // We pass a special marker — the user needs to re-enter password
      // Better UX: redirect to login with success message
      redirect: false,
    });
    setTimeout(() => router.push("/login?verificado=1"), 1500);
  }

  async function handleResend() {
    setResending(true);
    const result = await resendVerification(email);
    if (result.error) toast.error(result.error);
    else toast.success("Código reenviado. Revisá tu email.");
    setResending(false);
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-arena-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-warm-900 mb-2">¡Email verificado!</h1>
          <p className="text-warm-500 text-sm">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arena-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-arena-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-warm-900">Verificá tu email</h1>
          <p className="text-sm text-warm-500 mt-2">
            Enviamos un código de 6 dígitos a<br />
            <span className="font-medium text-warm-700">{email}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-arena-200 shadow-sm p-6">
          {/* 6-digit code input */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-arena-200 focus:border-arena-500 focus:outline-none transition-colors bg-arena-50"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-warm-500 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Reenviando...</>
            ) : (
              "Reenviar código"
            )}
          </Button>

          <p className="text-xs text-warm-400 text-center mt-3">
            El código expira en 30 minutos
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-arena-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerificarContent />
    </Suspense>
  );
}
