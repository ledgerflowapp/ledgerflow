import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id));

  if (profile?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md bg-card p-6 rounded-xl border shadow-sm">
        <OnboardingWizard 
          defaultStep={profile?.onboardingStep || 1} 
          defaultUsername={profile?.username || ""} 
          defaultCurrency={profile?.currencySymbol || "₹"} 
        />
      </div>
    </div>
  );
}
