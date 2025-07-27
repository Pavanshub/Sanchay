import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { formatPhone } from "../../lib/utils";
import { toast } from "sonner";

export const AuthForm = () => {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"vendor" | "supplier">("vendor");
  const [name, setName] = useState("");
  const { t } = useLanguage();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setStep("otp");
      toast.success("OTP sent to your phone");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user?.id)
        .maybeSingle();

      if (!profile) {
        setStep("profile");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role,
        name,
        phone: formatPhone(phone),
      });

      if (error) throw error;

      toast.success("Profile created successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t("auth.welcome")}
          </CardTitle>
          <CardDescription className="text-green-600 font-medium">
            {t("auth.tagline")}
          </CardDescription>
          <CardDescription>
            <div className="mt-4 p-3 bg-muted/30 rounded-xl text-sm text-muted-foreground">
              <strong>Test Login (Twilio Trial Mode)</strong>
              <br />
              Use one of the following phone numbers and OTPs to log in:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>
                  <strong>+91 91001 37698</strong> → <code>789789</code>
                </li>
                <li>
                  <strong>+91 94586 78345</strong> → <code>678678</code>
                </li>
                <li>
                  <strong>+91 97836 54728</strong> → <code>998909</code>
                </li>
                <li>
                  <strong>+91 78965 78785</strong> → <code>657564</code>
                </li>
              </ul>
              <span className="block mt-1 text-xs italic text-destructive">
                Note: Real phone numbers won’t work in Twilio trial mode. Only
                the test numbers above are supported.
              </span>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.phoneNumber")}
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                  className="text-center"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("auth.sendOtp")}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.enterOtp")}
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  className="text-center tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("auth.verifyOtp")}
              </Button>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.roleSelect")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("vendor")}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      role === "vendor"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">🛒</div>
                    <div className="text-sm font-medium">
                      {t("auth.vendor")}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("supplier")}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      role === "supplier"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">🏪</div>
                    <div className="text-sm font-medium">
                      {t("auth.supplier")}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("auth.name")}
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : t("auth.complete")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
