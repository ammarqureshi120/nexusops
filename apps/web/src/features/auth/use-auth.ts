"use client";

import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/api";

export const currentUserQueryKey = ["auth", "me"] as const;

export function useAuth() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.currentUser,
    refetchOnWindowFocus: true,
  });
}
