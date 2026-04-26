export type PlanId = "free" | "coach_pro" | "club_pro";
export type Plan = { id: PlanId; name: string; monthlyPrice: string; limits: { organizations: number; teams: number; groupmeGroups: number; aiQuestions: number; faqs: number }; features: string[] };
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", monthlyPrice: "$0", limits: { organizations: 1, teams: 1, groupmeGroups: 1, aiQuestions: 75, faqs: 10 }, features: ["1 team", "1 GroupMe bot", "Basic AI answers", "Game reminders"] },
  coach_pro: { id: "coach_pro", name: "Coach Pro", monthlyPrice: "$19", limits: { organizations: 1, teams: 3, groupmeGroups: 5, aiQuestions: 1000, faqs: 100 }, features: ["More teams and groups", "Higher AI volume", "Message review", "Reminder history"] },
  club_pro: { id: "club_pro", name: "Club Pro", monthlyPrice: "Custom", limits: { organizations: 5, teams: 50, groupmeGroups: 100, aiQuestions: 10000, faqs: 1000 }, features: ["Multi-team clubs", "Advanced analytics-ready", "Priority support", "Future Stripe invoicing"] }
};
export function getPlan(plan?: string | null) { return PLANS[(plan as PlanId) || "free"] ?? PLANS.free; }
export function isWithinLimit(planId: string | null | undefined, metric: keyof Plan["limits"], count: number) { return count < getPlan(planId).limits[metric]; }
export async function createCheckoutSessionStub(organizationId: string, plan: PlanId) { return { mode: "stub" as const, organizationId, plan, message: "Stripe checkout is isolated here. Add price IDs and call stripe.checkout.sessions.create in this function." }; }
