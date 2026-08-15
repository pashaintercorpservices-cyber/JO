"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string };

function readableAuthError(message: string): string {
  if (message.toLowerCase().includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  return message;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function loginAction(
  redirectTo: string,
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: readableAuthError(error.message) };

  redirect(redirectTo);
}

export async function registerCandidateAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!email || !password || !fullName) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  if (error) return { error: readableAuthError(error.message) };

  redirect("/account/applications");
}

export async function registerAgencyAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const contactName = String(formData.get("full_name") || "").trim();
  const agencyName = String(formData.get("agency_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const license = String(formData.get("license_number") || "").trim();

  if (!email || !password || !contactName || !agencyName || !phone) {
    return { error: "All fields except license number are required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: contactName, phone } },
  });
  if (signUpError) return { error: readableAuthError(signUpError.message) };

  const { error: rpcError } = await supabase.rpc("register_as_agency", {
    p_agency_name: agencyName,
    p_contact_phone: phone,
    p_license_number: license || null,
  });
  if (rpcError) return { error: rpcError.message };

  redirect("/agency/dashboard");
}
