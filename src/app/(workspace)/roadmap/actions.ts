"use server";

import { revalidatePath } from "next/cache";

import { getProductRoadmapItem } from "@/lib/product-roadmap";
import { setRoadmapInterest } from "@/lib/roadmap-interest";
import { requireActionRole } from "@/lib/route-authorization";

export async function setRoadmapInterestAction(roadmapItemId: string, isInterested: boolean) {
  const session = await requireActionRole(["customer", "admin"]);
  const item = getProductRoadmapItem(roadmapItemId);

  if (!item) {
    throw new Error("Roadmap item not found.");
  }

  const interest = await setRoadmapInterest({
    isInterested,
    roadmapItemId: item.id,
    userEmail: session.user.email,
    userName: session.user.name,
  });

  revalidatePath("/roadmap");
  return interest;
}
