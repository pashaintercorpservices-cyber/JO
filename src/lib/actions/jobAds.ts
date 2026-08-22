"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay, AD_POST_FEE_PAISE } from "@/lib/razorpay";
import {
  isEligibleForFirstPostDiscount,
  applyFirstPostDiscount,
  FIRST_POST_DISCOUNT_PERCENT,
  FIRST_POST_DISCOUNT_CODE,
} from "@/lib/discount";

export type AdFormState = { error?: string };

export async function createJobAdAction(
  _prev: AdFormState,
  formData: FormData
): Promise<AdFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!agency) return { error: "Agency profile not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
  const isSuperAdmin = profile?.is_super_admin ?? false;

  const title = String(formData.get("title") || "").trim();
  const employerName = String(formData.get("employer_name") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactEmail = String(formData.get("contact_email") || "").trim();
  const contactName = String(formData.get("contact_name") || "").trim();
  const contactPhone = String(formData.get("contact_phone") || "").trim();
  const vacanciesRaw = String(formData.get("vacancies") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const minMatchScoreRaw = String(formData.get("min_match_score") || "").trim();
  const minMatchScore = minMatchScoreRaw
    ? Math.max(0, Math.min(100, Number(minMatchScoreRaw)))
    : null;

  if (!title || !country || !contactEmail) {
    return { error: "Position title, country, and contact email are required." };
  }
  if (!imageUrl) {
    return { error: "Please upload an ad image before continuing — every ad is shown as an image on the homepage." };
  }

  const { data: ad, error: adError } = await supabase
    .from("job_ads")
    .insert({
      agency_id: agency.id,
      title,
      employer_name: employerName || null,
      country,
      city: city || null,
      description: description || null,
      contact_email: contactEmail,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      vacancies: vacanciesRaw ? Number(vacanciesRaw) : null,
      image_url: imageUrl || null,
      min_match_score: minMatchScore,
    })
    .select("id")
    .single();

  if (adError || !ad) return { error: adError?.message || "Could not save the ad." };

  const vacancyTitles = formData.getAll("vac_title").map((v) => String(v).trim());
  const vacancyCountries = formData.getAll("vac_country").map((v) => String(v).trim());
  const vacancyCities = formData.getAll("vac_city").map((v) => String(v).trim());
  const vacancySalaries = formData.getAll("vac_salary").map((v) => String(v).trim());
  const vacancyCounts = formData.getAll("vac_count").map((v) => String(v).trim());
  const vacancyDetails = formData.getAll("vac_details").map((v) => String(v).trim());
  const vacancyRequireVideo = formData.getAll("vac_require_video").map((v) => v === "true");

  const vacancyRows = vacancyTitles
    .map((vTitle, i) => ({
      job_ad_id: ad.id,
      title: vTitle,
      country: vacancyCountries[i] || country,
      city: vacancyCities[i] || city || null,
      salary_range: vacancySalaries[i] || null,
      vacancies: vacancyCounts[i] ? Number(vacancyCounts[i]) : null,
      details: vacancyDetails[i] || null,
      require_video_intro: vacancyRequireVideo[i] ?? false,
    }))
    .filter((v) => v.title);

  if (vacancyRows.length === 0) {
    vacancyRows.push({
      job_ad_id: ad.id,
      title,
      country,
      city: city || null,
      salary_range: null,
      vacancies: vacanciesRaw ? Number(vacanciesRaw) : null,
      details: description || null,
      require_video_intro: vacancyRequireVideo[0] ?? false,
    });
  }

  const { error: vacError } = await supabase.from("job_vacancies").insert(vacancyRows);
  if (vacError) return { error: vacError.message };

  if (isSuperAdmin) {
    const orderId = `waived_${ad.id}`;
    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({
        job_ad_id: ad.id,
        agency_id: agency.id,
        amount_paise: 0,
        razorpay_order_id: orderId,
      })
      .select("id")
      .single();
    if (payError || !payment) return { error: payError?.message || "Could not save the ad." };

    const { error: confirmError } = await supabase.rpc("confirm_ad_payment", {
      p_payment_id: payment.id,
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: "super_admin_waiver",
    });
    if (confirmError) return { error: confirmError.message };

    redirect(`/agency/ads/${ad.id}?paid=1`);
  }

  // First-post discount: 25% off, only for an agency with zero prior *paid* posts.
  // Checked here (server-side, at charge time) regardless of what the form page
  // displayed -- the display is a convenience, this check is the actual gate.
  const eligibleForDiscount = await isEligibleForFirstPostDiscount(supabase, agency.id);
  const chargeAmountPaise = eligibleForDiscount
    ? applyFirstPostDiscount(AD_POST_FEE_PAISE)
    : AD_POST_FEE_PAISE;

  let orderId = `mock_${ad.id}`;
  const rzp = getRazorpay();
  if (rzp) {
    const order = await rzp.orders.create({
      amount: chargeAmountPaise,
      currency: "INR",
      receipt: ad.id,
    });
    orderId = order.id;
  }

  const { data: payment, error: payError } = await supabase
    .from("payments")
    .insert({
      job_ad_id: ad.id,
      agency_id: agency.id,
      amount_paise: chargeAmountPaise,
      base_amount_paise: eligibleForDiscount ? AD_POST_FEE_PAISE : null,
      discount_code: eligibleForDiscount ? FIRST_POST_DISCOUNT_CODE : null,
      discount_percent: eligibleForDiscount ? FIRST_POST_DISCOUNT_PERCENT : null,
      razorpay_order_id: orderId,
    })
    .select("id")
    .single();

  if (payError || !payment) return { error: payError?.message || "Could not start payment." };

  redirect(`/agency/ads/${ad.id}/pay?payment=${payment.id}`);
}

export async function updateJobAdAction(
  _prev: AdFormState,
  formData: FormData
): Promise<AdFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const adId = String(formData.get("ad_id") || "").trim();
  if (!adId) return { error: "Missing ad reference." };

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!agency) return { error: "Agency profile not found." };

  const { data: existingAd } = await supabase
    .from("job_ads")
    .select("id, agency_id")
    .eq("id", adId)
    .single();
  if (!existingAd || existingAd.agency_id !== agency.id) {
    return { error: "Ad not found." };
  }

  const title = String(formData.get("title") || "").trim();
  const employerName = String(formData.get("employer_name") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactEmail = String(formData.get("contact_email") || "").trim();
  const contactName = String(formData.get("contact_name") || "").trim();
  const contactPhone = String(formData.get("contact_phone") || "").trim();
  const vacanciesRaw = String(formData.get("vacancies") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const minMatchScoreRaw = String(formData.get("min_match_score") || "").trim();
  const minMatchScore = minMatchScoreRaw
    ? Math.max(0, Math.min(100, Number(minMatchScoreRaw)))
    : null;

  if (!title || !country || !contactEmail) {
    return { error: "Position title, country, and contact email are required." };
  }
  if (!imageUrl) {
    return { error: "Please upload an ad image — every ad is shown as an image on the homepage." };
  }

  const { error: adError } = await supabase
    .from("job_ads")
    .update({
      title,
      employer_name: employerName || null,
      country,
      city: city || null,
      description: description || null,
      contact_email: contactEmail,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      vacancies: vacanciesRaw ? Number(vacanciesRaw) : null,
      image_url: imageUrl || null,
      min_match_score: minMatchScore,
    })
    .eq("id", adId);

  if (adError) return { error: adError.message };

  const vacancyTitles = formData.getAll("vac_title").map((v) => String(v).trim());
  const vacancyCountries = formData.getAll("vac_country").map((v) => String(v).trim());
  const vacancyCities = formData.getAll("vac_city").map((v) => String(v).trim());
  const vacancySalaries = formData.getAll("vac_salary").map((v) => String(v).trim());
  const vacancyCounts = formData.getAll("vac_count").map((v) => String(v).trim());
  const vacancyDetails = formData.getAll("vac_details").map((v) => String(v).trim());
  const vacancyRequireVideo = formData.getAll("vac_require_video").map((v) => v === "true");

  const vacancyRows = vacancyTitles
    .map((vTitle, i) => ({
      job_ad_id: adId,
      title: vTitle,
      country: vacancyCountries[i] || country,
      city: vacancyCities[i] || city || null,
      salary_range: vacancySalaries[i] || null,
      vacancies: vacancyCounts[i] ? Number(vacancyCounts[i]) : null,
      details: vacancyDetails[i] || null,
      require_video_intro: vacancyRequireVideo[i] ?? false,
    }))
    .filter((v) => v.title);

  if (vacancyRows.length === 0) {
    vacancyRows.push({
      job_ad_id: adId,
      title,
      country,
      city: city || null,
      salary_range: null,
      vacancies: vacanciesRaw ? Number(vacanciesRaw) : null,
      details: description || null,
      require_video_intro: vacancyRequireVideo[0] ?? false,
    });
  }

  // Replace the vacancy set. applications.job_vacancy_id is ON DELETE SET NULL, so existing
  // applications keep all their data (name, resume, position_applied snapshot) -- only the FK
  // link to a since-changed vacancy row is cleared, never the application itself.
  const { error: deleteError } = await supabase.from("job_vacancies").delete().eq("job_ad_id", adId);
  if (deleteError) return { error: deleteError.message };

  const { error: vacError } = await supabase.from("job_vacancies").insert(vacancyRows);
  if (vacError) return { error: vacError.message };

  redirect(`/agency/ads/${adId}?updated=1`);
}

export async function confirmMockPaymentAction(
  jobAdId: string,
  paymentId: string,
  orderId: string
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_ad_payment", {
    p_payment_id: paymentId,
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: `mock_pay_${Date.now()}`,
  });
  if (error) throw new Error(error.message);
  redirect(`/agency/ads/${jobAdId}?paid=1`);
}
