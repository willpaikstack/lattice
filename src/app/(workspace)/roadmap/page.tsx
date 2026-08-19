import { ProductRoadmapBoard, type ProductRoadmapBoardItem } from "@/components/product-roadmap-board";
import { productRoadmapItems } from "@/lib/product-roadmap";
import { listRoadmapInterestSummaries, listRoadmapInterestsForUser } from "@/lib/roadmap-interest";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const session = await getCurrentSession();
  const userEmail = session?.user.email ?? "";
  const [userInterests, interestSummaries] = await Promise.all([
    listRoadmapInterestsForUser(userEmail),
    listRoadmapInterestSummaries(),
  ]);
  const userInterestByItemId = new Map(userInterests.map((interest) => [interest.roadmapItemId, interest.isInterested]));
  const interestCountByItemId = new Map(interestSummaries.map((summary) => [summary.roadmapItemId, summary.interestedCount]));
  const items: ProductRoadmapBoardItem[] = productRoadmapItems.map((item) => ({
    ...item,
    interested: userInterestByItemId.get(item.id) ?? false,
    interestedCount: interestCountByItemId.get(item.id) ?? 0,
  }));

  return <ProductRoadmapBoard items={items} />;
}
