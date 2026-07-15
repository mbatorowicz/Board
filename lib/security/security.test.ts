import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, isSafeThumbTarget } from "@/lib/security/validate";
import { isPrivateOrLocalIp } from "@/lib/security/ip-range";
import { validatePin } from "@/lib/users";

describe("isSafeThumbTarget", () => {
  it("rejects localhost and private addresses", () => {
    expect(isSafeThumbTarget("http://127.0.0.1/")).toBe(false);
    expect(isSafeThumbTarget("http://localhost/")).toBe(false);
    expect(isSafeThumbTarget("http://192.168.1.1/")).toBe(false);
    expect(isSafeThumbTarget("http://10.0.0.5/")).toBe(false);
  });

  it("allows public https urls", () => {
    expect(isSafeThumbTarget("https://example.com/")).toBe(true);
  });
});

describe("isSafeHttpUrl", () => {
  it("allows https in production mode", () => {
    expect(isSafeHttpUrl("https://epuap.gov.pl/")).toBe(true);
  });
});

describe("isPrivateOrLocalIp", () => {
  it("detects loopback and RFC1918", () => {
    expect(isPrivateOrLocalIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalIp("192.168.0.10")).toBe(true);
    expect(isPrivateOrLocalIp("8.8.8.8")).toBe(false);
  });
});

describe("validatePin", () => {
  it("accepts numeric pins for readers", () => {
    expect(validatePin("1234", "reader")).toBe("1234");
  });

  it("requires longer alphanumeric pins for editors", () => {
    expect(validatePin("1234", "editor")).toBeNull();
    expect(validatePin("abcd1234", "editor")).toBe("abcd1234");
  });

  it("requires longer alphanumeric pins for admins", () => {
    expect(validatePin("admin123", "admin")).toBe("admin123");
  });
});
