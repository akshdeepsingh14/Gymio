// Sample team for the demo gym. Times are relative to now, so "last active" never goes stale.

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const DAY = 1440;

export function createDemoStaff() {
  return [
    {
      id: "staff_demo_1",
      name: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "",
      role: "manager",
      status: "active",
      invitedAt: ago(40 * DAY),
      lastActiveAt: ago(95),
    },
    {
      id: "staff_demo_2",
      name: "Rohit Pawar",
      email: "rohit.pawar@example.com",
      phone: "",
      role: "frontDesk",
      status: "active",
      invitedAt: ago(25 * DAY),
      lastActiveAt: ago(20 * 60),
    },
    {
      id: "staff_demo_3",
      name: "Sana Khan",
      email: "sana.khan@example.com",
      phone: "",
      role: "trainer",
      status: "invited",
      invitedAt: ago(26 * 60),
      lastActiveAt: null,
    },
    {
      id: "staff_demo_4",
      name: "Vikram Joshi",
      email: "vikram.joshi@example.com",
      phone: "",
      role: "trainer",
      status: "suspended",
      invitedAt: ago(60 * DAY),
      lastActiveAt: ago(20 * DAY),
    },
  ];
}