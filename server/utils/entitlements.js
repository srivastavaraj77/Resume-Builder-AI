import ApiError from "./ApiError.js";

export const FREE_TEMPLATE_IDS = ["classic", "minimal"];
export const ALL_TEMPLATE_IDS = ["classic", "minimal", "modern", "minimal-image"];

export const isProUser = (user) =>
  user?.plan === "pro" && ["active", "trialing", "lifetime"].includes(user?.subscriptionStatus || "");

export const getEntitlements = (user) => {
  const pro = isProUser(user);
  return {
    plan: pro ? "pro" : "free",
    allowedTemplates: pro ? ALL_TEMPLATE_IDS : FREE_TEMPLATE_IDS,
    canDownload: true,
  };
};

export const assertTemplateAccess = (user, templateId) => {
  const { allowedTemplates } = getEntitlements(user);
  if (templateId && !allowedTemplates.includes(templateId)) {
    throw new ApiError(
      403,
      "PLAN_RESTRICTION",
      "This template is available only for Pro users. Please upgrade to continue."
    );
  }
};

export const assertDownloadAccess = (user) => {
  void user;
};
