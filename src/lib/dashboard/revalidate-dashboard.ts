import { revalidatePath } from "next/cache";

export function revalidateDashboardData() {
  revalidatePath("/", "page");
  revalidatePath("/api/stats");
  revalidatePath("/api/firearms");
}
