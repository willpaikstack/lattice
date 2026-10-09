import { CustomerDashboardView } from "@/components/customer-dashboard-view";
import { currentUser } from "@clerk/nextjs/server";

import {
  buildCustomerDashboardSummary,
} from "@/lib/customer-dashboard";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { clerkUserDisplayName } from "@/lib/clerk-user-profile";
import { filterCustomerVisibleRequests } from "@/lib/request-access-policy";
import { listBuyerOrders, listBuyerQuotes } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";
import {
  getCustomerDashboardScenario,
  isCustomerDashboardScenario,
} from "@/lib/customer-dashboard-scenarios";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ scenario?: string }>;
};

export default async function Home({ searchParams }: DashboardPageProps = {}) {
  const requestedScenario = (await searchParams)?.scenario;
  const scenario = process.env.NODE_ENV !== "production" && isCustomerDashboardScenario(requestedScenario) ? requestedScenario : null;
  const [liveQuotes, liveOrders, session, clerkUser] = await Promise.all([listBuyerQuotes(), listBuyerOrders(), getCurrentSession(), currentUser()]);
  const scenarioData = scenario ? getCustomerDashboardScenario(scenario) : null;
  const quotes = (scenarioData?.quotes ?? liveQuotes).map(customerSafeRequest);
  const orders = (scenarioData?.orders ?? liveOrders).map(customerSafeRequest);
  // Dashboard scenarios are development-only fixtures; production requests remain
  // strictly filtered to the signed-in customer's company.
  const visibleQuotes = scenarioData ? quotes : filterCustomerVisibleRequests(quotes, session);
  const visibleOrders = scenarioData ? orders : filterCustomerVisibleRequests(orders, session);
  const dashboard = buildCustomerDashboardSummary(visibleQuotes, visibleOrders);
  const userName = session?.user.name || clerkUserDisplayName(clerkUser) || "there";
  return <CustomerDashboardView dashboard={dashboard} userName={userName} scenario={scenario} />;
}
