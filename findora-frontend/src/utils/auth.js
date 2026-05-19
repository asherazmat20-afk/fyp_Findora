export const getSession = () => ({
  token: sessionStorage.getItem("token") || "",
  userId: sessionStorage.getItem("userId") || "",
  userName: sessionStorage.getItem("userName") || "",
  role: sessionStorage.getItem("role") || "",
  orgId: sessionStorage.getItem("orgId") || "",
  orgName: sessionStorage.getItem("orgName") || "",
  orgSlug: sessionStorage.getItem("orgSlug") || "",
});

export const isOrgAdmin = () => getSession().role === "org_admin";

export const saveAuthSession = ({ token, user, organization }) => {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("userId", user?._id || "");
  sessionStorage.setItem("userName", user?.fullName || "");
  sessionStorage.setItem("role", user?.role || "member");
  sessionStorage.setItem("orgId", organization?._id || user?.organization || "");
  sessionStorage.setItem("orgName", organization?.name || "");
  sessionStorage.setItem("orgSlug", organization?.slug || "");
};

export const clearAuthSession = () => {
  sessionStorage.clear();
  localStorage.removeItem("isAdmin");
};
