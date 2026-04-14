import { redirect } from "next/navigation";

interface JoinAliasPageProps {
  params: Promise<{ lang: string }>;
}

export default async function JoinAliasPage({ params }: JoinAliasPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/booking`);
}
