import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, ShoppingBag, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/cuenta");

  const user = session.user;
  const unverified = !(user as { emailVerified?: Date | null }).emailVerified &&
    !(user as { image?: string }).image; // Google users are pre-verified

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Unverified banner */}
      {unverified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between text-sm">
          <span className="text-yellow-800">⚠️ Tu email no está verificado. Verificalo para recibir confirmaciones de tus pedidos.</span>
          <Link
            href={`/verificar?email=${encodeURIComponent(user.email ?? "")}`}
            className="text-yellow-700 font-semibold hover:underline ml-4 shrink-0"
          >
            Verificar ahora →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-arena-200 p-4 sticky top-24">
            {/* Avatar */}
            <div className="text-center pb-4 border-b border-arena-100 mb-4">
              <div className="w-14 h-14 rounded-full bg-arena-100 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                {(user as { image?: string }).image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(user as { image?: string }).image!} alt={user.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-arena-400" />
                )}
              </div>
              <p className="text-sm font-semibold text-warm-800 truncate">{user.name}</p>
              <p className="text-xs text-warm-400 truncate">{user.email}</p>
            </div>

            {/* Nav */}
            <nav className="space-y-1">
              <Link
                href="/cuenta/perfil"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-warm-700 hover:bg-arena-50 transition-colors"
              >
                <User className="w-4 h-4 text-arena-400" />
                Mi perfil
              </Link>
              <Link
                href="/cuenta/pedidos"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-warm-700 hover:bg-arena-50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-arena-400" />
                Mis pedidos
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-warm-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </form>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
