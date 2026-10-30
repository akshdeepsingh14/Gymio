// Plan actions. Same pattern as memberService: in the backend phase only the
// bodies of these functions change to API calls.

import { benefitsFromText, durationFromForm } from "@/lib/plans";
import { getDb, updateDb } from "@/services/mockDb";
import { ServiceError } from "@/services/memberService";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function assertUniqueName(db, name, ignoreId) {
  const wanted = name.trim().toLowerCase();
  const taken = db.plans.some((plan) => plan.id !== ignoreId && plan.name.trim().toLowerCase() === wanted);
  if (taken) throw new ServiceError("You already have a plan with this name.", "name");
}

function toPlanFields(input) {
  return {
    name: input.name.trim(),
    duration: durationFromForm(input),
    price: Number(input.price),
    description: input.description.trim(),
    benefits: benefitsFromText(input.benefits),
  };
}

export async function createPlan(input) {
  await wait();
  assertUniqueName(getDb(), input.name);

  const plan = {
    id: `plan_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    ...toPlanFields(input),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  updateDb((state) => ({ ...state, plans: [...state.plans, plan] }));
  return plan;
}

/** Changes apply to future sign-ups and renewals only. Past payments keep their own amount. */
export async function updatePlan(id, input) {
  await wait();
  const db = getDb();
  if (!db.plans.some((plan) => plan.id === id)) throw new ServiceError("Plan not found.");
  assertUniqueName(db, input.name, id);

  const fields = toPlanFields(input);
  updateDb((state) => ({
    ...state,
    plans: state.plans.map((plan) => (plan.id === id ? { ...plan, ...fields } : plan)),
  }));
}

/** status: "active" | "archived". Archived plans cannot be given to members, and nobody is deleted. */
export async function setPlanStatus(id, status) {
  await wait(250);
  if (!["active", "archived"].includes(status)) throw new ServiceError("Unknown plan status.");
  if (!getDb().plans.some((plan) => plan.id === id)) throw new ServiceError("Plan not found.");

  updateDb((state) => ({
    ...state,
    plans: state.plans.map((plan) => (plan.id === id ? { ...plan, status } : plan)),
  }));
}