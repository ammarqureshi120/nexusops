import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/lib/api";

import { AuthForm } from "./auth-form";
import { currentUserQueryKey } from "./use-auth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function renderWithQuery(ui: ReactElement): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return queryClient;
}

describe("AuthForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
  });

  it("associates client validation feedback with accessible fields", async () => {
    renderWithQuery(<AuthForm mode="register" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    expect(screen.getByLabelText("Full name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Work email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Use at least 12 characters.",
    );
  });

  it("disables submission while signing in and owns the successful auth transition", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          }),
      ),
    );
    const queryClient = renderWithQuery(<AuthForm mode="login" />);
    await userEvent.type(
      screen.getByLabelText("Work email"),
      "ada@example.com",
    );
    await userEvent.type(
      screen.getByLabelText("Password"),
      "a long passphrase",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();

    const user: User = {
      id: "user-1",
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      createdAt: "2026-09-23T00:00:00.000Z",
    };
    resolveRequest?.(
      new Response(JSON.stringify({ data: user }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app"));
    expect(queryClient.getQueryData(currentUserQueryKey)).toEqual(user);
  });

  it("shows a safe API authentication error without losing entered values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 401,
            title: "Authentication required",
            code: "invalid_credentials",
            detail: "Email or password is incorrect.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    renderWithQuery(<AuthForm mode="login" />);
    const email = screen.getByLabelText("Work email");
    await userEvent.type(email, "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong password");
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );
    expect(email).toHaveValue("ada@example.com");
  });
});
