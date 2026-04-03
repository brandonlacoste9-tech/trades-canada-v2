import { isValidLang, type Lang } from "@/lib/i18n";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function UpdatePasswordPage({ params }: Props) {
  const { lang } = await params;
  const l = (isValidLang(lang) ? lang : "en") as Lang;
  return <UpdatePasswordForm lang={l} />;
}
