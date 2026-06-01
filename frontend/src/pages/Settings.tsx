import * as React from "react";
import { 
  Building2, 
  Leaf, 
  Users, 
  Save,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";


const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 animate-pulse" />
        <Skeleton className="h-4 w-96 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Org settings */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 animate-pulse" />
                <Skeleton className="h-3.5 w-72 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32 animate-pulse" />
                <Skeleton className="h-10 w-full animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3.5 w-24 animate-pulse" />
                    <Skeleton className="h-10 w-full animate-pulse" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-9 w-44 animate-pulse" />
            </CardContent>
          </Card>

          {/* Card 2: Emission standard settings */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 animate-pulse" />
                <Skeleton className="h-3.5 w-72 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32 animate-pulse" />
                <Skeleton className="h-10 w-64 max-w-full animate-pulse" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-32 animate-pulse" />
                <div className="border border-esg-moss/20 rounded-xl overflow-hidden p-4 space-y-3 bg-esg-clay/10">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <Skeleton className="h-3.5 w-48 animate-pulse" />
                      <Skeleton className="h-3.5 w-24 animate-pulse" />
                      <Skeleton className="h-3.5 w-32 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: User Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 animate-pulse" />
                <Skeleton className="h-3 w-36 animate-pulse" />
              </div>
              <Skeleton className="h-7 w-16 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-esg-moss/20 last:border-0">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 animate-pulse" />
                    <Skeleton className="h-3 w-40 animate-pulse" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { user, createUser, accessToken } = useAuth();
  
  // Dynamic settings data
  const [team, setTeam] = React.useState<{ name: string; email: string; role: string }[]>([]);
  const [companyName, setCompanyName] = React.useState("Acme Corporation");
  const [baseYear, setBaseYear] = React.useState("2024");
  const [targetYear, setTargetYear] = React.useState("2035");
  const [reductionTarget, setReductionTarget] = React.useState("50");
  const [settingsLoading, setSettingsLoading] = React.useState(true);

  React.useEffect(() => {
    if (accessToken) {
      setSettingsLoading(true);
      Promise.all([
        authService.getTenantDetails(accessToken),
        authService.listUsers(accessToken)
      ]).then(([details, users]) => {
        setCompanyName(details.company_name);
        setBaseYear(String(details.baseline_year));
        setTargetYear(String(details.target_year));
        setReductionTarget(String(details.reduction_target));
        setEmissionsStandard(details.emissions_standard || "epa_2025");
        setTeam(users.map(u => ({
          name: u.full_name,
          email: u.email,
          role: u.role
        })));
      }).catch((err) => {
        console.error("Failed to load settings data:", err);
      }).finally(() => {
        setSettingsLoading(false);
      });
    }
  }, [accessToken]);

  // Form states for creating a new user
  const [newEmail, setNewEmail] = React.useState("");
  const [newFullName, setNewFullName] = React.useState("");
  const [newRole, setNewRole] = React.useState<"ANALYST" | "REVIEWER" | "ADMIN">("ANALYST");
  const [newPassword, setNewPassword] = React.useState("");
  const [creatingUser, setCreatingUser] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [savingOrg, setSavingOrg] = React.useState(false);
  const [savingFactors, setSavingFactors] = React.useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Administrator';

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFullName || !newPassword) {
      toast("Missing Information", "Please fill in all user profile details.", "warning");
      return;
    }
    setCreatingUser(true);
    try {
      const created = await createUser({
        email: newEmail,
        full_name: newFullName,
        role: newRole,
        password: newPassword
      });
      setTeam(prev => [...prev, { name: created.full_name, email: created.email, role: created.role }]);
      toast("User Created Successfully", `${created.full_name} has been provisioned as ${created.role}.`, "success");
      setNewEmail("");
      setNewFullName("");
      setNewPassword("");
      setShowCreateForm(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to create user.";
      toast("Provisioning Failed", errorMessage, "error");
    } finally {
      setCreatingUser(false);
    }
  };

  // Factors state
  const [emissionsStandard, setEmissionsStandard] = React.useState("epa_2025");

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSavingOrg(true);
    toast("Saving Configuration", "Writing company registry updates...", "info");
    try {
      await authService.updateTenantDetails({
        baseline_year: Number(baseYear),
        target_year: Number(targetYear),
        reduction_target: Number(reductionTarget)
      }, accessToken);
      toast("Configuration Saved", "Organization profile successfully updated in general registry.", "success");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to save configuration.";
      toast("Save Failed", errorMessage, "error");
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveFactors = async () => {
    if (!accessToken) return;
    setSavingFactors(true);
    toast("Updating Standards", `Emissions coefficients updated to ${emissionsStandard.replace('_', ' ').toUpperCase()}`, "info");
    try {
      await authService.updateTenantDetails({
        emissions_standard: emissionsStandard
      }, accessToken);
      toast("Standard Factors Locked", "All future calculations will utilize selected database parameters.", "success");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Failed to update emissions standard.";
      toast("Update Failed", errorMessage, "error");
    } finally {
      setSavingFactors(false);
    }
  };

  const activeFactors = React.useMemo(() => {
    if (emissionsStandard.includes("epa")) {
      return [
        { label: "Purchased Electricity (US Grid Mix)", value: "0.385 kg CO2e/kWh", source: "EPA eGRID 2025" },
        { label: "Mobile Combustion (Fleet Diesel)", value: "2.68 kg CO2e/Liter", source: "EPA GHG Factors 2025" },
        { label: "Mobile Combustion (Fleet Gasoline)", value: "2.31 kg CO2e/Liter", source: "EPA GHG Factors 2025" },
        { label: "Stationary Combustion (Natural Gas)", value: "2.05 kg CO2e/m3", source: "EPA GHG Factors 2025" }
      ];
    } else {
      return [
        { label: "Purchased Electricity (UK Grid Mix)", value: "0.207 kg CO2e/kWh", source: "DEFRA UK Factors 2025" },
        { label: "Mobile Combustion (Diesel Standard)", value: "2.51 kg CO2e/Liter", source: "DEFRA UK Factors 2025" },
        { label: "Mobile Combustion (Gasoline Standard)", value: "2.22 kg CO2e/Liter", source: "DEFRA UK Factors 2025" },
        { label: "Business Travel Flights (Short Haul)", value: "0.27 kg CO2e/passenger-mile", source: "DEFRA RF standard" }
      ];
    }
  }, [emissionsStandard]);

  if (settingsLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-esg-dark font-sans">Corporate Workspace Settings</h2>
        <p className="text-xs text-esg-muted mt-1">
          Manage your organization profile, set carbon reduction targets, update team members, and select active emissions standard factors from a single page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Left Column: Organization Profile & Emissions Standards */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Building2 className="h-4 w-4 text-esg-muted animate-pulse" />
                <span>Organization Settings</span>
              </CardTitle>
              <CardDescription>
                Define entity disclosures variables and target reduction timelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveOrg} className="space-y-6 max-w-xl">
                <Input
                  label="Registered Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="Baseline Year"
                    value={baseYear}
                    onChange={(e) => setBaseYear(e.target.value)}
                    disabled={!isAdmin}
                    required
                  />
                  
                  <Input
                    type="number"
                    label="Target Year"
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    disabled={!isAdmin}
                    required
                  />

                  <Input
                    type="number"
                    label="Reduction Target (%)"
                    value={reductionTarget}
                    onChange={(e) => setReductionTarget(e.target.value)}
                    helperText="VS baseline year inventory"
                    disabled={!isAdmin}
                    required
                  />
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t border-esg-moss/50">
                    <Button type="submit" className="space-x-1.5 text-xs min-w-[200px]" disabled={savingOrg}>
                      {savingOrg ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save General Configuration</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Leaf className="h-4 w-4 text-esg-muted" />
                <span>Greenhouse Gas Coefficients</span>
              </CardTitle>
              <CardDescription>
                Select active greenhouse factors and review conversion coefficients for Scopes 1, 2, and 3.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md">
                <Select
                  label="Emissions Factors Library"
                  value={emissionsStandard}
                  onChange={(e) => setEmissionsStandard(e.target.value)}
                  disabled={!isAdmin}
                >
                  <option value="epa_2025">EPA GHG Factors Hub (2025 - US region default)</option>
                  <option value="defra_2025">DEFRA Emissions Factors (2025 - UK / International)</option>
                  <option value="ghg_protocol_2025">GHG Protocol Standard Mix (2025)</option>
                </Select>
              </div>

              {/* Active list table */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-esg-dark uppercase tracking-wider block">
                  Active Factors Table
                </span>
                
                <div className="border border-esg-moss/60 rounded-xl overflow-hidden bg-esg-clay/20">
                  <table className="w-full text-xs text-left divide-y divide-esg-moss/40">
                    <thead className="bg-esg-moss/30 font-semibold text-esg-dark">
                      <tr>
                        <th className="p-3 pl-4">Emissions Source / Category</th>
                        <th className="p-3">Calculation Factor</th>
                        <th className="p-3 pr-4">Authority Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-esg-moss/30 text-esg-text">
                      {activeFactors.map((fact, idx) => (
                        <tr key={idx} className="hover:bg-esg-moss/10 transition-colors">
                          <td className="p-3 pl-4 font-medium text-esg-dark">{fact.label}</td>
                          <td className="p-3 font-mono font-semibold">{fact.value}</td>
                          <td className="p-3 pr-4 text-esg-muted">{fact.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-esg-moss/50">
                  <Button onClick={handleSaveFactors} className="space-x-1.5 text-xs min-w-[260px]" disabled={savingFactors}>
                    {savingFactors ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Update Ingestion Database Factors</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Team Management */}
        <div className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center text-base">
                  <Users className="h-4 w-4 mr-2 text-esg-muted" />
                  <span>Active Users</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Team personnel credentials.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-[10px] h-7 px-2.5 bg-esg-ivory hover:bg-esg-moss/30 border-esg-border/60"
                  onClick={() => setShowCreateForm(true)}
                >
                  Add User
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {isAdmin && (
                <Dialog
                  isOpen={showCreateForm}
                  onClose={() => setShowCreateForm(false)}
                  title="Provision New Team Member"
                >
                  <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                    <Input
                      label="Full Name"
                      placeholder="Bob Analyst"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      required
                    />
                    <Input
                      type="email"
                      label="Email Address"
                      placeholder="bob@acme.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                    <Select
                      label="Role Assignment"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                    >
                      <option value="ANALYST">ANALYST</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                    <Input
                      type="password"
                      label="Temporary Password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <div className="pt-2 flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="text-xs h-9 px-4 bg-esg-ivory hover:bg-esg-moss/30 border-esg-border/60"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="text-xs h-9 px-4 min-w-[150px]" 
                        disabled={creatingUser}
                      >
                        {creatingUser ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
                          "Create User Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                </Dialog>
              )}

              {team.map((member, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between text-xs pb-3 ${
                    idx < team.length - 1 ? "border-b border-esg-moss/40" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-esg-dark">{member.name}</p>
                    <p className="text-[10px] text-esg-muted">{member.email}</p>
                  </div>
                  <Badge 
                    variant={member.role === 'ADMIN' ? 'outline' : member.role === 'REVIEWER' ? 'secondary' : 'default'}
                    className={member.role === 'ADMIN' ? 'border-esg-sand text-esg-dark bg-esg-sand/10' : ''}
                  >
                    {member.role === 'ADMIN' ? 'Admin' : member.role === 'REVIEWER' ? 'Auditor' : 'Analyst'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
