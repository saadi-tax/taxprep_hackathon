import { useQuery } from "@tanstack/react-query";

import { fetchApiHealth } from "../api/client";

export const useApiHealth = () => {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchApiHealth,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
};

