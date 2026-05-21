import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Verify a Google ID token via tokeninfo endpoint ─────────────────────────
async function verifyGoogleIdToken(idToken: string): Promise<AdapterUser | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;

    const payload = await res.json();

    // Validate audience
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    // Validate expiry
    if (Number(payload.exp) < Date.now() / 1000) return null;

    const email: string = payload.email;
    const name: string = payload.name ?? email.split("@")[0];
    const image: string | null = payload.picture ?? null;

    if (!email) return null;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name, image, emailVerified: new Date(), role: "CUSTOMER" },
      });
    } else if (!user.emailVerified) {
      // Google confirmed the email — mark it verified
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    return { id: user.id, email: user.email!, name: user.name, image: user.image, emailVerified: user.emailVerified };
  } catch (e) {
    console.error("Google token verification error:", e);
    return null;
  }
}

// ─── Custom adapter: prevent duplicate-user errors on OAuth linking ───────────
const baseAdapter = PrismaAdapter(prisma);

const customAdapter: Adapter = {
  ...baseAdapter,
  /**
   * When Google OAuth tries to create a user whose email already exists
   * (registered via credentials), return the existing user instead of throwing.
   * NextAuth will then call linkAccount() to attach the Google account.
   */
  async createUser(data: AdapterUser) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email! },
    });
    if (existing) {
      return {
        id: existing.id,
        email: existing.email!,
        name: existing.name,
        emailVerified: existing.emailVerified,
        image: existing.image,
      } as AdapterUser;
    }
    return baseAdapter.createUser!(data);
  },

  /**
   * Upsert the OAuth account instead of hard-failing on duplicates.
   */
  async linkAccount(data: AdapterAccount) {
    try {
      await baseAdapter.linkAccount!(data);
    } catch {
      // Account already linked (e.g. from a previous attempt) — update tokens
      await prisma.account.updateMany({
        where: { provider: data.provider, userId: data.userId },
        data: {
          providerAccountId: data.providerAccountId,
          access_token: data.access_token ?? null,
          id_token: data.id_token ?? null,
          expires_at: data.expires_at ?? null,
          scope: data.scope ?? null,
          token_type: data.token_type ?? null,
        },
      });
    }
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: customAdapter,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })]
      : []),
    Credentials({
      async authorize(credentials) {
        // ── Google One Tap path (id token instead of password) ──
        if (credentials?.idToken) {
          return verifyGoogleIdToken(credentials.idToken as string);
        }

        // ── Email + password path ──
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const valid = await compare(parsed.data.password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true },
        });
        token.id = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "CUSTOMER";
      }
      return token;
    },
  },
});
