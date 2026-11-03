import type { Metadata } from "next";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const metadata: Metadata = {
  title: "Log in · Nigertoday TV",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-neutral-0 lg:grid-cols-2">
      <LoginBrandPanel />

      <section className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-6 lg:hidden">
            <BrandLogo className="h-20! sm:h-14"/>
          </div>

          <h1 className="text-[28px] font-semibold leading-9 text-neutral-900">Welcome back</h1>
          <p className="mb-8 mt-2 text-base leading-6 text-neutral-500">Log in to manage your customers.</p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}