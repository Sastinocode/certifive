const ONBOARDING_KEY = "certifive_onboarding_v1_done";

export function useOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    window.location.reload();
  };

  const isOnboardingDone = () => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  };

  return { resetOnboarding, isOnboardingDone };
}
