import type { Metadata } from "next";
import Link from "next/link";
import { Egg } from "@/components/Egg";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-page px-5 text-center text-fg">
      <div className="anim-bob">
        <Egg size={110} face />
      </div>
      <p className="mt-8 text-eyebrow font-semibold uppercase text-fg-subtle">Erro 404</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Esse ovo rolou pra longe</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
        A página que você procurou não existe. Volte para o timer e deixe o seu ovo no ponto perfeito.
      </p>
      <Link
        href="/"
        className="press mt-8 rounded-full bg-inverse px-7 py-4 text-base font-medium text-on-inverse shadow-lift"
      >
        Voltar ao timer
      </Link>
    </main>
  );
}
