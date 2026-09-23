import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthBoundary } from "./auth-boundary";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("AuthBoundary", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("resolves the server session before redirecting an unauthenticated user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 401,
            title: "Authentication required",
            code: "authentication_required",
            detail: "Sign in to continue.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthBoundary>
          <p>Protected content</p>
        </AuthBoundary>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Checking your session…")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signin"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
