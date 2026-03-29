import { cookies, headers } from "next/headers";
import { defaultLocale, isValidLang, type Lang } from "@/lib/i18n";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default async function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerList = await headers();
  
  // Try cookie first, then header, then default
  const cookieLang = cookieStore.get("next-locale")?.value;
  const headerLang = headerList.get("accept-language")?.split(",")[0]?.split("-")[0];
  
  const lang = (isValidLang(cookieLang || "") ? cookieLang : isValidLang(headerLang || "") ? headerLang : defaultLocale) as Lang;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar lang={lang} />
      <main className="flex-1 container py-8 mt-16 pb-24">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
