"use client";

import { useEffect } from "react";

/** Sets document.documentElement.lang from a nested layout without nested <html> tags. */
export default function LangHtmlSetter({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
