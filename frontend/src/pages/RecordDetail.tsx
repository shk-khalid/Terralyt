import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  Edit3, 
  AlertTriangle, 
  FileCode, 
  History, 
  Building,
  Calendar,
  Database,
  Info
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { useAuth } from "@/context/AuthContext";
import { getCalculatedEmissions } from "@/utils/emissions";
import { reviewService, type ReviewRecordDetail } from "@/services/reviewService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";

export const RecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { approveRecord, rejectRecord, correctRecord } = useESGData();
  const { user } = useAuth();

  const [record, setRecord] = React.useState<ReviewRecordDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Actions states
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  // Edit fields
  const [editFacility, setEditFacility] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editQuantity, setEditQuantity] = React.useState(0);
  const [editUnit, setEditUnit] = React.useState("");

  const loadRecord = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await reviewService.getRecordDetail(id);
      setRecord(data);
      setEditFacility(data.facility_name || "");
      setEditCategory(data.activity_type || "");
      setEditQuantity(data.quantity);
      setEditUnit(data.normalized_unit);
    } catch (err) {
      console.error("Failed to load record:", err);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center text-xs text-esg-muted">
          Loading emission record details...
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <Link to="/review" className="flex items-center space-x-2 text-xs font-semibold text-esg-muted hover:text-esg-dark transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Audit Queue</span>
        </Link>
        <Card className="p-8 text-center text-xs text-esg-muted">
          Record not found.
        </Card>
      </div>
    );
  }

  const scopeNum = record.scope === "SCOPE_1" ? 1 : record.scope === "SCOPE_2" ? 2 : 3;
  const emissionsVal = getCalculatedEmissions(record.activity_type, record.quantity, record.normalized_unit);

  const handleApprove = async () => {
    if (!user) return;
    try {
      toast("Processing", "Submitting approval to ledger...", "info");
      await approveRecord(record.id);
      toast("Approved Successfully", `Record ${record.id} signed off.`, "success");
      loadRecord();
    } catch (err) {
      toast("Error", "Could not complete approval step.", "error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!user || !rejectReason.trim()) {
      toast("Required Fields Missing", "Please input a rejection justification.", "warning");
      return;
    }
    try {
      setIsRejectOpen(false);
      toast("Processing", "Logging rejection reason...", "info");
      await rejectRecord(record.id, rejectReason);
      toast("Record Rejected", `Record ${record.id} status updated to REJECTED.`, "warning");
      loadRecord();
    } catch (err) {
      toast("Error", "Could not submit audit decision.", "error");
    }
  };

  const handleEditSubmit = async () => {
    if (!user) return;
    if (!editFacility.trim() || !editCategory.trim() || editQuantity <= 0 || !editUnit.trim()) {
      toast("Validation Error", "All adjustment fields must contain valid parameters.", "warning");
      return;
    }
    try {
      setIsEditOpen(false);
      toast("Saving", "Writing adjustments and recalculating carbon values...", "info");
      await correctRecord(record.id, {
        quantity: editQuantity,
        normalized_unit: editUnit,
        unit: editUnit
      });
      toast("Record Adjusted", `Record ${record.id} revised and emissions recalculated.`, "success");
      loadRecord();
    } catch (err) {
      toast("Adjustment Failed", "Check database write permission logs.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & title */}
      <div className="flex flex-col space-y-3">
        <Link to="/review" className="flex items-center space-x-2 text-xs font-semibold text-esg-muted hover:text-esg-dark transition-colors self-start">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Audit Queue</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-esg-dark font-sans">{record.id.substring(0, 8)}... Detailed Audit</h2>
              <Badge variant={record.review_status.toLowerCase() as any}>{record.review_status.toLowerCase()}</Badge>
              {record.anomaly_flag && (
                <Badge variant="anomaly">anomaly</Badge>
              )}
            </div>
            <p className="text-xs text-esg-muted mt-1">
              File Ingestion Origin: <span className="font-semibold text-esg-dark">{record.source_type} Ingestion</span>
            </p>
          </div>
          {/* Actions top bar */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="space-x-1 text-xs bg-esg-clay">
              <Edit3 className="h-3.5 w-3.5" />
              <span>Adjust Inputs</span>
            </Button>
            {record.review_status === 'PENDING' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsRejectOpen(true)} 
                  className="text-xs bg-esg-clay border-esg-sand/40 hover:bg-esg-sand/15"
                >
                  Reject Entry
                </Button>
                <Button onClick={handleApprove} size="sm" className="text-xs space-x-1">
                  <Check className="h-4 w-4" />
                  <span>Approve & Disclose</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Overview stats and validation alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Validation warnings */}
          {record.anomaly_flag && record.anomaly_reason && (
            <div className="space-y-3">
              <Alert variant="warning">
                <AlertTitle className="text-xs flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Compliance Warning / Anomaly
                </AlertTitle>
                <AlertDescription>
                  {record.anomaly_reason}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Core Data Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Breakdown</CardTitle>
              <CardDescription>
                Standard coefficients mapped to raw activity inputs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-esg-moss/20 border border-esg-moss/50 rounded-xl p-4">
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Raw Quantity</span>
                  <span className="text-lg font-bold text-esg-dark block mt-1">
                    {Number(record.quantity).toLocaleString()} {record.normalized_unit}
                  </span>
                </div>
                
                <div className="bg-esg-moss/20 border border-esg-moss/50 rounded-xl p-4">
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Scope tier</span>
                  <span className="text-lg font-bold text-esg-dark block mt-1">
                    Scope {scopeNum}
                  </span>
                </div>

                <div className="bg-esg-sage/20 border border-esg-sage rounded-xl p-4">
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Calculated Emissions</span>
                  <span className="text-lg font-extrabold text-esg-dark block mt-1">
                    {emissionsVal} tCO2e
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-esg-moss/50 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 p-3 border-b border-esg-moss/40 bg-esg-clay/30">
                  <span className="font-semibold text-esg-dark">Facility Context</span>
                  <span className="text-esg-text text-right flex items-center justify-end">
                    <Building className="h-3.5 w-3.5 mr-1 text-esg-muted" />
                    {record.facility_name}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-esg-moss/40">
                  <span className="font-semibold text-esg-dark">Category Classification</span>
                  <span className="text-esg-text text-right uppercase">{record.activity_type}</span>
                </div>
                <div className="grid grid-cols-2 p-3 border-b border-esg-moss/40 bg-esg-clay/30">
                  <span className="font-semibold text-esg-dark">Activity Date</span>
                  <span className="text-esg-text text-right flex items-center justify-end">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-esg-muted" />
                    {record.activity_date}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-3">
                  <span className="font-semibold text-esg-dark">Data Origin</span>
                  <span className="text-esg-text text-right flex items-center justify-end">
                    <Database className="h-3.5 w-3.5 mr-1 text-esg-muted" />
                    {record.source_type} Ingestion
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Payload Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileCode className="h-5 w-5 mr-2 text-esg-muted" />
                Raw Payload Code View
              </CardTitle>
              <CardDescription>
                Direct parser outputs as written by API service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-esg-clay text-esg-text p-4 rounded-xl text-xs font-mono overflow-auto border border-esg-border/50 max-h-60 leading-relaxed select-all">
                {JSON.stringify(record.raw_payload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Audit log timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2 text-esg-muted" />
                Record Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-esg-moss/50 pl-8 pt-1">
                {record.audit_history && record.audit_history.length > 0 ? (
                  record.audit_history.map((evt) => (
                    <div key={evt.id} className="relative text-xs leading-normal">
                      <span className="absolute left-[-26px] top-1 h-3.5 w-3.5 rounded-full bg-esg-sage flex items-center justify-center border-2 border-esg-ivory" />
                      <div className="font-semibold text-esg-dark">
                        {evt.action_type.replace('_', ' ')}
                      </div>
                      <p className="text-[10px] text-esg-muted mt-0.5">by {evt.actor}</p>
                      <p className="text-esg-text mt-1 bg-esg-clay/30 border border-esg-moss/30 p-2 rounded-lg">
                        {evt.old_value ? `Changed: ${JSON.stringify(evt.old_value)} → ${JSON.stringify(evt.new_value)}` : 'Created record.'}
                      </p>
                      <span className="text-[9px] text-esg-muted block mt-1.5">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-esg-muted">No actions recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject reason Dialog */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Flag Record Rejection"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRejectOpen(false)} className="bg-esg-clay">
              Cancel
            </Button>
            <Button onClick={handleRejectSubmit} size="sm" className="bg-esg-sand text-white">
              Confirm Reject
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-2 p-3 bg-esg-sand/15 border border-esg-sand/50 rounded-xl text-xs text-esg-dark">
            <Info className="h-4 w-4 mr-1 shrink-0 text-esg-sand" />
            <span>Rejections are logged immediately to the audit ledger. The analyst will receive an automated request to upload matching files.</span>
          </div>

          <Input
            label="Audit Rejection Justification"
            placeholder="e.g. Missing vehicle logs, or incorrect billing cycle dates."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </div>
      </Dialog>

      {/* Adjust fields Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Recalibrate Data Inputs"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="bg-esg-clay">
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} size="sm">
              Save & Recalculate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-2 p-3 bg-esg-moss/30 border border-esg-border rounded-xl text-xs text-esg-text">
            <Info className="h-4 w-4 mr-1 shrink-0" />
            <span>Changing quantities or categories triggers automatic greenhouse gas index coefficients recalculation.</span>
          </div>

          <Input
            label="Origin Facility"
            value={editFacility}
            onChange={(e) => setEditFacility(e.target.value)}
            required
            disabled
          />

          <Input
            label="Reporting Category"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            required
            disabled
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Raw Quantity"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value))}
              required
            />
            <Input
              label="Standard Unit"
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
              required
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
