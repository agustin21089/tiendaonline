import { prisma } from "@/lib/prisma";
import { buildThemeCSS } from "@/lib/theme";

/**
 * Server component — reads SiteSettings once per request and injects a
 * <style> tag that overrides the Tailwind v4 CSS variables with the
 * user-chosen palette.
 *
 * Also sets data-theme="dark" on <html> when darkMode is enabled.
 * (The attribute is set via inline script to avoid a flash-of-wrong-theme.)
 */
export async function ThemeStyle() {
  const settings = await prisma.siteSettings
    .findUnique({
      where: { id: "singleton" },
      select: { primaryColor: true, neutralColor: true, darkMode: true },
    })
    .catch(() => null);

  const primaryColor = settings?.primaryColor ?? "#B07D45";
  const neutralColor = settings?.neutralColor ?? "#787868";
  const darkMode = settings?.darkMode ?? false;

  const css = buildThemeCSS({ primaryColor, neutralColor, darkMode });

  return (
    <>
      {/* Inject dynamic palette */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Set data-theme="dark" ASAP (inline script avoids FOIT) */}
      {darkMode && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-theme','dark')`,
          }}
        />
      )}
    </>
  );
}
