import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Shield, Lock, Mail, CheckCircle, Building, Briefcase, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

export const RegisterTenant: React.FC = () => {
  const [companyName, setCompanyName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [adminName, setAdminName] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { registerTenant, user } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "", color: "bg-transparent", textClass: "text-transparent" };
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-red-800/40", textClass: "text-red-800/60" };
      case 2:
      case 3:
        return { score, label: "Fair", color: "bg-amber-700/45", textClass: "text-amber-700/60" };
      case 4:
        return { score, label: "Good", color: "bg-esg-sage/65", textClass: "text-esg-dark/70 font-medium" };
      case 5:
      default:
        return { score, label: "Strong", color: "bg-emerald-700/50", textClass: "text-emerald-700/60" };
    }
  };

  const strength = React.useMemo(() => checkPasswordStrength(password), [password]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !industry || !adminName || !adminEmail || !password) {
      toast("Missing Fields", "Please complete all registration fields.", "warning");
      return;
    }

    if (strength.score < 4) {
      toast("Weak Password", "Please choose a stronger password matching the strength requirements.", "warning");
      return;
    }

    setLoading(true);
    try {
      await registerTenant({
        company_name: companyName,
        industry,
        admin_name: adminName,
        admin_email: adminEmail,
        password
      });
      toast("Registration Successful", `Welcome to Terralyt! ${companyName} has been registered. Please sign in with your administrator account.`, "success");
      navigate("/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Could not register organization tenant. Try again.";
      toast("Registration Failed", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-esg-ivory p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-esg-sage/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-esg-moss/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-esg-clay border border-esg-moss/65 shadow-2xl rounded-2xl overflow-hidden min-h-[550px]">
        {/* Left Side: Brand & Details */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-esg-sage text-esg-dark relative">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-esg-ivory flex items-center justify-center shadow-md">
              <Leaf className="h-4 w-4 text-esg-dark" />
            </div>
            <span className="font-bold text-lg tracking-tight">Terralyt</span>
          </div>

          <div className="space-y-4 my-auto">
            <h2 className="text-2xl font-bold leading-tight">
              Create Your ESG Workspace
            </h2>
            <p className="text-sm text-esg-dark/80 leading-relaxed">
              Register your organization to instantly provision a secure, dedicated tenant workspace. Build standard GHG protocol inventories and invite your analytics team.
            </p>
            <div className="space-y-2 pt-4">
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Isolated tenant databases and datasets</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Admin controls for provisioning analysts & auditors</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Ready-to-use Scope 1, 2, and 3 disclosures pipelines</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-esg-dark/60 border-t border-esg-dark/20 pt-4">
            <Shield className="h-4 w-4 shrink-0" />
            <span>Multi-Tenant Enterprise Separation Protocol Enforced</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="flex flex-col justify-center p-8 bg-esg-clay">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl font-bold">Register Tenant</CardTitle>
              <CardDescription>
                Provision a new corporate ESG account.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Input
                  label="Company / Organization Name"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  icon={<Building className="h-4 w-4 text-esg-muted" />}
                  required
                />

                <Input
                  label="Industry Vertical"
                  placeholder="Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  icon={<Briefcase className="h-4 w-4 text-esg-muted" />}
                  required
                />

                <Input
                  label="Administrator Full Name"
                  placeholder="Alice Admin"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  icon={<User className="h-4 w-4 text-esg-muted" />}
                  required
                />

                <Input
                  type="email"
                  label="Administrator Email"
                  placeholder="alice@acme.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4 text-esg-muted" />}
                  required
                />
                
                <Input
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4 text-esg-muted" />}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-esg-muted hover:text-esg-dark transition-colors cursor-pointer bg-transparent border-none outline-none p-1 mr-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                />

                <div className="pt-2 w-full">
                  <div className="h-2 w-full bg-esg-moss/30 rounded-full overflow-hidden border border-esg-moss/45 shadow-inner">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300 shadow-sm`} 
                      style={{ width: `${(Math.max(password ? 1 : 0, strength.score) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 mt-2"
                  disabled={loading || strength.score < 4}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Create Tenant Workspace"
                  )}
                </Button>
              </form>

              {/* Redirect to Sign In */}
              <div className="pt-4 border-t border-esg-moss/50 text-center">
                <p className="text-xs text-esg-muted font-sans">
                  Already registered?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="font-semibold text-esg-dark hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
