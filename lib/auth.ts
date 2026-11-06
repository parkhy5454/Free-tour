import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createSession(user: { id: string; role: string; name: string; email: string }) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("7d").sign(getSecret());
  const jar = await cookies();
  jar.set("freetour_session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get("freetour_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { id: string; role: string; name: string; email: string };
  } catch { return null; }
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("freetour_session");
}
