import { describe, expect, it } from "vitest";
import { explainNativeGoogleError } from "./nativeOAuth";

describe("explainNativeGoogleError", () => {
  it("returns a clear cancellation message", () => {
    expect(explainNativeGoogleError("Sign-in cancelled by the user")).toBe(
      "Google sign-in was cancelled.",
    );
  });

  it("explains Android OAuth configuration failures", () => {
    expect(explainNativeGoogleError("Credential error: configuration error")).toContain(
      "com.user.mabuhai",
    );
  });

  it("preserves unknown plugin errors", () => {
    expect(explainNativeGoogleError("Google Play Services unavailable")).toBe(
      "Google Play Services unavailable",
    );
  });
});
