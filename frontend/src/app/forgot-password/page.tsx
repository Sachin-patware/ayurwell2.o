"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import OTPInput from "@/components/auth/OTPInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type Step = "request" | "verify" | "reset" | "success";

const stepLabels: Record<Step, string> = {
  request: "Step 1 of 3",
  verify: "Step 2 of 3",
  reset: "Step 3 of 3",
  success: "Completed",
};

function getApiErrorMessage(err: unknown): string {
  const error = err as {
    response?: { data?: { error?: string; message?: string } };
  };

  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    "Something went wrong"
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isRequestingOtp },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerResetPassword,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResettingPassword },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const requestOtp = async (data: EmailFormData) => {
    try {
      setError(null);
      setMessage(null);

      const res = await api.post("/auth/forgot-password", {
        email: data.email,
      });

      setEmail(data.email);
      setStep("verify");
      setMessage("OTP sent to your email");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setError(null);
      setMessage(null);

      const res = await api.post("/auth/verify-forget-password", {
        email,
        otp,
      });

      const token = res.data?.resetToken;
      if (!token) {
        setError("Reset token not received. Please verify OTP again.");
        return;
      }

      setResetToken(token);
      setStep("reset");
      setMessage(res.data.message || "OTP verified successfully");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    try {
      setIsResendingOtp(true);
      setError(null);
      setMessage(null);

      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message || "A new OTP has been sent");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const submitNewPassword = async (data: ResetPasswordFormData) => {
    try {
      setError(null);
      setMessage(null);

      const res = await api.post("/auth/reset-password", {
        resetToken,
        newPassword: data.newPassword,
      });

      setStep("success");
      setMessage(res.data.message || "Password reset successfully");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#F5F5DC] to-[#E8F5E9] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
          <div className="h-2 bg-linear-to-r from-[#2E7D32] to-[#81C784]" />

          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#1B5E20]">
              Forgot Password
            </CardTitle>
            <CardDescription>
              {step === "request" && "Enter your email to receive OTP"}
              {step === "verify" && `Enter the OTP sent to ${email}`}
              {step === "reset" && "Set your new password"}
              {step === "success" && "Your password has been updated"}
            </CardDescription>
            <p className="text-xs text-[#2E7D32] font-medium mt-1">
              {stepLabels[step]}
            </p>
          </CardHeader>

          <CardContent>
            {message && (
              <div className="p-3 mb-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {step === "request" && (
              <form
                onSubmit={handleEmailSubmit(requestOtp)}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...registerEmail("email")}
                    className="mt-1 h-11"
                  />
                  {emailErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {emailErrors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#2E7D32] hover:bg-[#1B5E20]"
                  disabled={isRequestingOtp}
                >
                  {isRequestingOtp ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {step === "verify" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block text-center">
                    Enter Verification Code
                  </label>
                  <OTPInput
                    key={`forgot-${email}`}
                    length={6}
                    onComplete={setOtp}
                    disabled={isVerifyingOtp}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full h-11 bg-[#2E7D32] hover:bg-[#1B5E20]"
                  onClick={verifyOtp}
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Verifying OTP...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setOtp("");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-[#2E7D32] font-medium hover:underline"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isResendingOtp}
                    className="text-[#2E7D32] font-medium hover:underline disabled:opacity-50"
                  >
                    {isResendingOtp ? "Resending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

            {step === "reset" && (
              <form
                onSubmit={handleResetSubmit(submitNewPassword)}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-semibold">New Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...registerResetPassword("newPassword")}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2E7D32] transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {resetErrors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {resetErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      {...registerResetPassword("confirmPassword")}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2E7D32] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {resetErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {resetErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#2E7D32] hover:bg-[#1B5E20]"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Updating Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {step === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 text-center">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </p>
                <Link href="/login" className="block">
                  <Button className="w-full h-11 bg-[#2E7D32] hover:bg-[#1B5E20]">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}

            <div className="text-center mt-5 text-sm">
              <Link href="/login" className="text-[#2E7D32] font-medium">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
