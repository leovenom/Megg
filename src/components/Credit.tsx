import { GITHUB_URL } from "@/lib/site";
import { useT } from "@/lib/i18n";

export function Credit({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <p className={`text-center text-micro text-fg-subtle ${className}`}>
      {t.credit}
      <span aria-hidden> · </span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-line underline-offset-4 transition-colors hover:text-fg"
      >
        GitHub
      </a>
    </p>
  );
}
