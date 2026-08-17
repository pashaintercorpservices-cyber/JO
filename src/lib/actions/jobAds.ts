"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay, AD_POST_FEE_PAISE } from "@/lib/razorpay";

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

  const vacancyRows = vacancyTitles
    .map((vTitle, i) => ({
      job_ad_id: ad.id,
      title: vTitle,
      country: vacancyCountries[i] || country,
      city: vacancyCities[i] || city || null,
      salary_range: vacancySalaries[i] || null,
      vacancies: vacancyCounts[i] ? Number(vacancyCounts[i]) : null,
      details: vacancyDetails[i] || null,
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

  let orderId = `mock_${ad.id}`;
  const rzp = getRazorpay();
  if (rzp) {
    const order = await rzp.orders.create({
      amount: AD_POST_FEE_PAISE,
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
      amount_paise: AD_POST_FEE_PAISE,
      razorpay_order_id: orderId,
    })
    .select("id")
    .single();

  if (payError || !payment) return { error: payError?.message || "Could not start payment." };

  redirect(`/agency/ads/${ad.id}/pay?payment=${payment.id}`);
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
