// Spots a member who is being added twice.
//
// Two different people can share a phone number (a parent and child, a couple), so a shared
// phone or email alone is NOT a duplicate. It is a duplicate when the same name also matches,
// which means the same person is being registered again.

const nameKey = (name) => String(name ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** Digits only, last 10, so "+91 98765 43210" and "9876543210" match. Too-short numbers are ignored. */
export const phoneKey = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : "";
};

export const emailKey = (email) => String(email ?? "").trim().toLowerCase();

/**
 * The first existing member with the same name and the same phone or email, or null.
 * Pass ignoreId when editing, so a member is never compared with themselves.
 * Returns { field: "phone" | "email", member }.
 */
export function findDuplicateMember(members, { name, phone, email }, ignoreId) {
  const wantedName = nameKey(name);
  const wantedPhone = phoneKey(phone);
  const wantedEmail = emailKey(email);
  if (!wantedName || (!wantedPhone && !wantedEmail)) return null;

  for (const member of members) {
    if (member.id === ignoreId || nameKey(member.name) !== wantedName) continue;
    if (wantedPhone && phoneKey(member.phone) === wantedPhone) return { field: "phone", member };
    if (wantedEmail && emailKey(member.email) === wantedEmail) return { field: "email", member };
  }
  return null;
}

export const duplicateMessage = ({ field, member }) =>
  `${member.name} (${member.id}) is already a member with this ${field === "phone" ? "phone number" : "email"}. Open that member instead of adding another.`;