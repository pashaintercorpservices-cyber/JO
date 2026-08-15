import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AD_POST_FEE_PAISE } from "@/lib/razorpay";
import { NewAdForm } from "./NewAdForm";

export default async function NewAdPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/agency/login");

  return (
    <>
      <div className="section-head">
        <p className="eyebrow">Agency</p>
        <h1>Post a new vacancy</h1>
        <p>This goes live on the JobsOverseas homepage once payment is confirmed and an admin approves it.</p>
      </div>
      <NewAdForm userId={user.id} feePaise={AD_POST_FEE_PAISE} />
    </>
  );
}
