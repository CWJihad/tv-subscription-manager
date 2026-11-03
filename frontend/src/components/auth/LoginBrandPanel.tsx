import Image from "next/image";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginStatChip, type LoginStatTone } from "./LoginStatChip";

interface LoginHighlight {
  value: number;
  label: string;
  tone: LoginStatTone;
}

/** Decorative numbers from the design. Not real data: counts must not be exposed before login. */
const HIGHLIGHTS: readonly LoginHighlight[] = [
  { value: 24, label: "customers active", tone: "success" },
  { value: 4, label: "expiring this month", tone: "warning" },
  { value: 2, label: "expired — follow up", tone: "danger" },
];

/** Left photo panel. Hidden below lg (the mobile design has no photo panel). */
export function LoginBrandPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-primary-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <Image
        src="https://res.cloudinary.com/dfhfxt50d/image/upload/v1793716557/brand_bg-image_1_ena4dk.webp"
        alt=""
        fill
        priority
        unoptimized
        sizes="50vw"
        className="scale-105 object-cover blur-sm"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-neutral-900/55" />

      <div className="relative z-10">
        <BrandLogo className="h-30! xl:h-16"/>
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex max-w-lg flex-col gap-4">
          <p className="text-4xl font-bold leading-[44px] text-white">Know who to call today.</p>
          <p className="text-base leading-6 text-neutral-100">
            Track every customer subscription, see who is expiring, and send renewal reminders in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map((item) => (
            <LoginStatChip key={item.label} {...item} />
          ))}
        </div>
      </div>

      <p className="relative z-10 text-xs leading-[18px] text-neutral-200">
        Private owner dashboard · Works on phone and computer
      </p>
    </section>
  );
}