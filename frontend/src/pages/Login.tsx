import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Leaf, Shield, Lock, Mail, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

export const Login: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve the original page the user tried to access, default to home "/"
  const from = (location.state as any)?.from?.pathname || "/";

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Missing Credentials", "Please enter both email and password.", "warning");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast("Welcome Back", `Successfully signed in!`, "success");
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.error || "Login failed. Please verify your credentials.";
      toast("Sign In Failed", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-esg-ivory p-4 relative overflow-hidden">
      {/* Decorative leaf shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-esg-sage/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-esg-moss/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-esg-clay border border-esg-moss/65 shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        {/* Left Side: Brand & Marketing Banner */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-esg-sage text-esg-dark relative">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-esg-ivory flex items-center justify-center shadow-md">
              <Leaf className="h-4 w-4 text-esg-dark" />
            </div>
            <span className="font-bold text-lg tracking-tight">Terralyt</span>
          </div>

          <div className="space-y-4 my-auto">
            <h2 className="text-2xl font-bold leading-tight">
              Enterprise ESG Data Operations
            </h2>
            <p className="text-sm text-esg-dark/80 leading-relaxed">
              Standardize your Scope 1, 2, and 3 carbon accounting. Conduct multi-facility audit sweeps and resolve data ingestion anomalies on one compliance platform.
            </p>
            <div className="space-y-2 pt-4">
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Automated validation engines (EPA & DEFRA)</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Transparent blockchain-ready audit trails</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle className="h-4 w-4 text-esg-dark shrink-0" />
                <span>Direct SAP ERP and PGE billing parsers</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-esg-dark/60 border-t border-esg-dark/20 pt-4">
            <Shield className="h-4 w-4 shrink-0" />
            <span>GHG Protocol Corporate Standard Compliant Portal</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center p-8 bg-esg-clay">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Access your carbon accounting dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Business Email"
                  placeholder="analyst@terralyt.esg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

                <Button 
                  type="submit" 
                  className="w-full h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Sign In to Portal"
                  )}
                </Button>
              </form>

              {/* Redirect to Tenant Registration */}
              <div className="pt-6 border-t border-esg-moss/50 text-center">
                <p className="text-xs text-esg-muted font-sans">
                  New to Terralyt?{" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="font-semibold text-esg-dark hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    Register tenant organization
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
