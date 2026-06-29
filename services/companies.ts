import { supabase } from "@/services/supabase";

export async function getCurrentUserCompany() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}