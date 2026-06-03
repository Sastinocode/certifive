import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

type Feature = "whatsapp" | "reports" | "invoicing" | "multi_user";

const PLAN_FEATURES: Record<string, Feature[]> = {
  free:        [],
  basico:      [],
  pay_per_use: [],
  profesional: ["whatsapp", "reports", "invoicing"],
  pro:         ["whatsapp", "reports", "invoicing"],
  empresa:     ["whatsapp", "reports", "invoicing", "multi_user"],
  enterprise:  ["whatsapp", "reports", "invoicing", "multi_user"],
};

interface SubscriptionData {
  plan: string;
  status: string;
}

export function usePlanFeatures() {
  const { isAuthenticated, token } = useAuth();

  const { data } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const plan = (data?.plan ?? "free").toLowerCase();
  const features: Feature[] = PLAN_FEATURES[plan] ?? [];

  const canUse = (feature: Feature): boolean => features.includes(feature);

  const isAtLeastPro = canUse("whatsapp"); // profesional, empresa, enterprise
  const isEnterprise = canUse("multi_user");

  return { canUse, plan, isAtLeastPro, isEnterprise };
}
