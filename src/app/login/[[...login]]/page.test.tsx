import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: { forceRedirectUrl?: string; path?: string; routing?: string; signUpUrl?: string }) => (
    <div data-force-redirect-url={props.forceRedirectUrl} data-path={props.path} data-routing={props.routing} data-sign-up-url={props.signUpUrl}>
      Clerk sign-in
    </div>
  ),
}));

import LoginPage from "./page";

describe("Login page", () => {
  it("uses Clerk's path-based flow for the sign-in page and its SSO callbacks", () => {
    render(<LoginPage />);

    const signIn = screen.getByText("Clerk sign-in");
    expect(signIn).toHaveAttribute("data-path", "/login");
    expect(signIn).toHaveAttribute("data-routing", "path");
    expect(signIn).toHaveAttribute("data-sign-up-url", "/sign-up");
    expect(signIn).toHaveAttribute("data-force-redirect-url", "/dashboard");
  });
});
