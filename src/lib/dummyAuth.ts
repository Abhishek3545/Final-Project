export type DummyAuthUser = {
  id: string;
  email: string;
  method: "google" | "email" | "phone";
};

const DUMMY_USER_KEY = "rrx_dummy_auth_user";

export const isDummyAuthMode = () => import.meta.env.VITE_AUTH_DUMMY_MODE !== "false";

export const getStoredDummyUser = (): DummyAuthUser | null => {
  const raw = localStorage.getItem(DUMMY_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DummyAuthUser;
  } catch {
    localStorage.removeItem(DUMMY_USER_KEY);
    return null;
  }
};

export const setStoredDummyUser = (method: DummyAuthUser["method"], identifier?: string) => {
  let email = "demo.user@retailrealmx.local";

  if (method === "google") {
    email = "google.demo@retailrealmx.local";
  } else if (method === "phone") {
    const digits = (identifier || "").replace(/\D/g, "").slice(-10) || "0000000000";
    email = `phone.${digits}@retailrealmx.local`;
  } else if (identifier?.includes("@")) {
    email = identifier.toLowerCase();
  }

  const user: DummyAuthUser = {
    id: "00000000-0000-4000-8000-000000000001",
    email,
    method,
  };

  localStorage.setItem(DUMMY_USER_KEY, JSON.stringify(user));
  return user;
};

export const clearStoredDummyUser = () => {
  localStorage.removeItem(DUMMY_USER_KEY);
};
