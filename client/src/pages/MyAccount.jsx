import React, { useEffect, useState } from "react";
import { authApi, paymentApi } from "../lib/api";
import { loadRazorpayCheckoutScript } from "../lib/razorpay";

const MyAccount = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    profession: "",
    website: "",
    linkedin: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await authApi.me();
        const user = data?.user || {};
        setPlan(user.plan === "pro" ? "pro" : "free");
        setProfileForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.location || "",
          profession: user.profession || "",
          website: user.website || "",
          linkedin: user.linkedin || "",
          bio: user.bio || "",
        });
      } catch (loadError) {
        setError(loadError.message || "Failed to load account details");
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setMessage("Payment successful. Your Pro access is being activated.");
    } else if (payment === "cancel") {
      setError("Payment was canceled. You can try again anytime.");
    }
  }, []);

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setMessage("");
    setError("");

    try {
      const data = await authApi.updateProfile(profileForm);
      const updatedUser = data?.user;
      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setPlan(updatedUser.plan === "pro" ? "pro" : "free");
      }
      setMessage("Profile updated successfully.");
    } catch (submitError) {
      setError(submitError.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setIsStartingCheckout(true);
    setError("");
    setMessage("");
    try {
      const isRazorpayLoaded = await loadRazorpayCheckoutScript();
      if (!isRazorpayLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout. Please try again.");
      }

      const data = await paymentApi.createOrder();
      if (!data?.orderId || !data?.keyId) {
        throw new Error("Unable to create order. Please try again.");
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Resume Builder",
        description: "Upgrade to Pro",
        order_id: data.orderId,
        prefill: data.prefill || {},
        theme: { color: "#1f2937" },
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment(response);
            const profileData = await authApi.me();
            const updatedUser = profileData?.user;
            if (updatedUser) {
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setPlan(updatedUser.plan === "pro" ? "pro" : "free");
            }
            setMessage("Payment successful. Pro access is now active.");
            setError("");
          } catch (verificationError) {
            setError(verificationError.message || "Payment verification failed. Please contact support.");
          }
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
      });

      rzp.open();
      return;
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to start checkout.");
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setMessage("");
    setError("");

    try {
      await authApi.changePassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setMessage("Password updated successfully.");
    } catch (submitError) {
      setError(submitError.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h1 className="text-xl font-semibold text-slate-800">My Account</h1>
        <div className="mt-3 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <p className="text-xs text-slate-500">Current Plan</p>
            <p className={`text-sm font-semibold ${plan === "pro" ? "text-green-700" : "text-slate-700"}`}>
              {plan === "pro" ? "Pro" : "Free"}
            </p>
          </div>
          {plan !== "pro" && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isStartingCheckout}
              className="px-3 py-1.5 rounded bg-amber-500 text-white text-xs hover:bg-amber-600 disabled:opacity-60"
            >
              {isStartingCheckout ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          )}
        </div>
        <div className="mt-4 flex gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`px-3 py-1.5 rounded text-sm ${
              activeSection === "profile"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("password")}
            className={`px-3 py-1.5 rounded text-sm ${
              activeSection === "password"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Change Password
          </button>
        </div>

        {activeSection === "profile" && (
          <form onSubmit={submitProfile} className="mt-4">
            <div className="space-y-3">
              <input
                name="name"
                value={profileForm.name}
                onChange={onProfileChange}
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded border border-slate-300"
                required
              />
              <input
                name="email"
                type="email"
                value={profileForm.email}
                onChange={onProfileChange}
                placeholder="Email"
                className="w-full px-3 py-2 rounded border border-slate-300"
                required
              />
              <input
                name="phone"
                value={profileForm.phone}
                onChange={onProfileChange}
                placeholder="Phone"
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
              <input
                name="location"
                value={profileForm.location}
                onChange={onProfileChange}
                placeholder="Location"
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
              <input
                name="profession"
                value={profileForm.profession}
                onChange={onProfileChange}
                placeholder="Profession"
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
              <input
                name="website"
                value={profileForm.website}
                onChange={onProfileChange}
                placeholder="Website URL"
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
              <input
                name="linkedin"
                value={profileForm.linkedin}
                onChange={onProfileChange}
                placeholder="LinkedIn URL"
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={onProfileChange}
                placeholder="Short bio"
                rows={4}
                className="w-full px-3 py-2 rounded border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-4 w-full py-2 rounded bg-slate-800 text-white disabled:opacity-60"
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}

        {activeSection === "password" && (
          <form onSubmit={submitPassword} className="mt-4">
            <div className="space-y-3">
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                placeholder="Current Password"
                className="w-full px-3 py-2 rounded border border-slate-300"
                required
              />
              <input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                placeholder="New Password"
                className="w-full px-3 py-2 rounded border border-slate-300"
                required
              />
              <input
                name="confirmNewPassword"
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={onPasswordChange}
                placeholder="Confirm New Password"
                className="w-full px-3 py-2 rounded border border-slate-300"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-4 w-full py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {(message || error) && (
          <div className="mt-4">
            {message && <p className="text-sm text-green-700">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAccount;
