import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "./logout-button";
import { currentUserQueryKey } from "./use-auth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("clears the single auth cache and returns to sign in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    queryClient.setQueryData(currentUserQueryKey, {
      id: "user-1",
      email: "ada@example.com",
      displayName: "Ada Lovelace",
      createdAt: "2026-09-23T00:00:00.000Z",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signin"));
    expect(queryClient.getQueryData(currentUserQueryKey)).toBeNull();
  });
});
