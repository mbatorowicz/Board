"use client";

export default function CsrfFieldClient({ token }: { token: string }) {
  return <input type="hidden" name="csrf" value={token} />;
}
