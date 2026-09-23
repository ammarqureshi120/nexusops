"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ApiError, authApi } from "@/lib/api";

import { currentUserQueryKey } from "./use-auth";

export function LogoutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: finishLogout,
    onError: (error: Error) => {
      if (error instanceof ApiError && error.problem.status === 401) {
        finishLogout();
      }
    },
  });

  function finishLogout(): void {
    queryClient.setQueryData(currentUserQueryKey, null);
    router.replace("/signin");
  }

  return (
    <div className="logout-control">
      <button
        className="secondary-button"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
        type="button"
      >
        {logout.isPending ? "Signing out…" : "Sign out"}
      </button>
      {logout.isError &&
      !(
        logout.error instanceof ApiError && logout.error.problem.status === 401
      ) ? (
        <p className="compact-error" role="alert">
          Sign out failed. Please try again.
        </p>
      ) : null}
    </div>
  );
}
