// Who did something. Records store { id, name, role } so history survives a rename or removal.

export const actorRef = (actor) =>
  actor ? { id: actor.id, name: actor.name, role: actor.roleLabel } : null;

export const describeActor = (ref, fallback = "Not recorded") =>
  ref?.name ? (ref.role ? `${ref.name} · ${ref.role}` : ref.name) : fallback;