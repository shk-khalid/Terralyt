import * as React from "react";
import { 
  Search, 
  User, 
  Calendar, 
  Bookmark,
  Loader2
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { reviewService } from "@/services/reviewService";
import { getCalculatedEmissions } from "@/utils/emissions";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { Skeleton } from "@/components/ui/Skeleton";

const AuditLogsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64 animate-pulse" />
        <Skeleton className="h-4 w-96 animate-pulse" />
      </div>

      {/* Search and Category Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <Skeleton className="h-10 w-full animate-pulse" />
        <div className="flex gap-2 justify-end">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Timeline List Skeleton */}
      <Card>
        <CardContent className="p-6 pt-8 pb-8">
          <div className="space-y-8 pl-8 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-esg-moss/30">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative space-y-3">
                <span className="absolute left-[-21px] top-1.5 h-3 w-3 rounded-full border-2 border-esg-moss/50 bg-esg-ivory animate-pulse" />
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Skeleton className="h-5 w-16 animate-pulse" />
                    <Skeleton className="h-5 w-24 animate-pulse" />
                  </div>
                  <Skeleton className="h-3.5 w-32 animate-pulse" />
                </div>
                <Skeleton className="h-4 w-full max-w-2xl animate-pulse" />
                <Skeleton className="h-3.5 w-48 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AuditLogs: React.FC = () => {
  const { auditLogs, auditLogsLoading } = useESGData();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [inspectedRecordId, setInspectedRecordId] = React.useState<string | null>(null);
  
  const [inspectedRecord, setInspectedRecord] = React.useState<any | null>(null);
  const [loadingRecord, setLoadingRecord] = React.useState(false);

  // Categories list
  const categories = ["ALL", "INGESTION", "REVIEW", "MODIFICATION", "SYSTEM"];

  // Helper to map backend action to UI category
  const getActionCategory = (action: string): string => {
    const act = (action || '').toUpperCase();
    if (act === 'UPLOADED') return 'INGESTION';
    if (act === 'APPROVED' || act === 'REJECTED') return 'REVIEW';
    if (act === 'UPDATED') return 'MODIFICATION';
    return 'SYSTEM';
  };

  // Helper to construct detail string from backend log entry
  const getLogDetailsText = (log: any): string => {
    if (log.action === 'UPLOADED') {
      const info = log.new_value || {};
      return `File ${info.file_name || 'unknown'} uploaded containing ${info.total_rows || 0} rows. Parsing outcome: ${info.successful_rows || 0} successes, ${info.failed_rows || 0} failures.`;
    }
    if (log.action === 'APPROVED') {
      return `Approved ESG Record. Status updated to APPROVED for reporting.`;
    }
    if (log.action === 'REJECTED') {
      return `Rejected ESG Record. Reason: "${log.new_value?.rejection_reason || 'N/A'}". Status updated to REJECTED.`;
    }
    if (log.action === 'UPDATED') {
      const oldVals = log.old_value || {};
      const newVals = log.new_value || {};
      const changedFields = Object.keys(newVals).map(key => `${key} (${oldVals[key] || 'none'} → ${newVals[key]})`).join(', ');
      return `Edited ESG Record fields: ${changedFields || 'No modifications'}.`;
    }
    return `Performed ${log.action} action on system assets.`;
  };

  // Filter logs based on search and category
  const filteredLogs = React.useMemo(() => {
    return auditLogs.filter((log) => {
      const logDetails = getLogDetailsText(log);
      const logCat = getActionCategory(log.action);
      const recordIdStr = log.object_affected?.id || "";

      const matchesSearch = 
        logDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recordIdStr.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "ALL" ? true : logCat === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [auditLogs, searchQuery, selectedCategory]);

  // Load detailed record data when inspecting
  React.useEffect(() => {
    if (inspectedRecordId) {
      setLoadingRecord(true);
      reviewService.getRecordDetail(inspectedRecordId)
        .then(data => setInspectedRecord(data))
        .catch(err => {
          console.error("Failed to load inspected record details:", err);
          setInspectedRecord(null);
        })
        .finally(() => setLoadingRecord(false));
    } else {
      setInspectedRecord(null);
    }
  }, [inspectedRecordId]);

  if (auditLogsLoading && auditLogs.length === 0) {
    return <AuditLogsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-esg-dark font-sans">Compliance Audit Logs</h2>
        <p className="text-xs text-esg-muted mt-1">
          Cryptographically aligned operations ledger tracking modifications, ingestion errors, and auditor sign-offs.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="lg:col-span-1">
          <Input
            placeholder="Search by action, user, record ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-esg-muted" />}
            className="h-10 text-xs bg-esg-clay"
          />
        </div>

        {/* Category Pills */}
        <div className="lg:col-span-2 flex flex-wrap gap-2 justify-start lg:justify-end">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all focus-ring ${
                selectedCategory === cat
                  ? "bg-esg-sage text-esg-dark font-bold shadow-sm"
                  : "bg-esg-clay text-esg-muted hover:bg-esg-moss/50 hover:text-esg-dark"
              }`}
            >
              {cat.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <Card>
        <CardContent className="p-6 pt-8 pb-8 max-h-[600px] overflow-y-auto pr-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-esg-muted">
              No audit logs match the current search filters.
            </div>
          ) : (
            <div className="space-y-4 md:space-y-8 relative md:before:absolute md:before:left-4 md:before:top-3 md:before:bottom-3 md:before:w-0.5 md:before:bg-esg-moss/30 pl-0 md:pl-8">
              {filteredLogs.map((log) => {
                const logCat = getActionCategory(log.action);
                const recordId = log.object_affected?.id;
                return (
                  <div 
                    key={log.id} 
                    className="relative text-xs leading-normal pb-4 md:pb-2 border md:border-0 border-esg-border/50 bg-esg-clay/10 md:bg-transparent rounded-xl md:rounded-none p-4 md:p-0 space-y-2 md:space-y-0"
                  >
                    {/* timeline marker - desktop only */}
                    <span className="absolute left-[-21px] top-1.5 h-3 w-3 rounded-full border-2 border-esg-moss/50 bg-esg-ivory hidden md:block" />

                    {/* Metadata Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-esg-border/30 pb-2 md:border-b-0 md:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-esg-clay border-esg-moss/50 text-[9px] uppercase font-bold py-0.5 px-1.5">
                          {logCat}
                        </Badge>
                        <span className="font-bold text-esg-dark text-xs uppercase tracking-wide">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-[10px] text-esg-muted font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(log.timestamp).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Details content */}
                    <p className="text-esg-text mt-2 mb-2 pl-0.5 max-w-4xl leading-relaxed text-xs">
                      {getLogDetailsText(log)}
                    </p>

                    {/* Associated actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2.5 pt-2 border-t border-esg-border/30 md:border-t-0 md:pt-0 pl-0.5 text-[10px] text-esg-muted">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-esg-muted/70" />
                        Actor: <strong className="text-esg-text ml-0.5 font-medium">{log.actor}</strong>
                      </span>
                      {recordId && (
                        <button
                          onClick={() => setInspectedRecordId(recordId)}
                          className="flex items-center text-esg-muted hover:text-esg-dark font-medium underline underline-offset-2 transition-colors focus-ring"
                        >
                          <Bookmark className="h-3 w-3 mr-1 text-esg-muted/70" />
                          Inspect Record: <strong className="text-esg-text ml-0.5 font-semibold">{recordId.substring(0, 8)}...</strong>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Inspect Dialog */}
      <Dialog
        isOpen={inspectedRecordId !== null}
        onClose={() => setInspectedRecordId(null)}
        title={inspectedRecord ? `Record Preview: ${inspectedRecord.id.substring(0, 8)}...` : "Record Details"}
      >
        {loadingRecord ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-xs text-esg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-esg-sage" />
            <span>Fetching record specs...</span>
          </div>
        ) : inspectedRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-esg-clay border border-esg-moss/50 rounded-xl p-4 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Origin Facility</span>
                <span className="font-bold text-esg-dark mt-0.5 block">{inspectedRecord.facility_name}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Activity Date</span>
                <span className="font-bold text-esg-dark mt-0.5 block">{inspectedRecord.activity_date}</span>
              </div>
              <Separator className="col-span-2 my-0.5" />
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Source Category</span>
                <span className="font-bold text-esg-dark mt-0.5 block uppercase">{inspectedRecord.activity_type}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Consumption Value</span>
                <span className="font-bold text-esg-dark mt-0.5 block">{Number(inspectedRecord.quantity).toLocaleString()} {inspectedRecord.normalized_unit}</span>
              </div>
              <Separator className="col-span-2 my-0.5" />
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Emissions Weight</span>
                <span className="font-bold text-esg-dark mt-0.5 block">
                  {getCalculatedEmissions(inspectedRecord.activity_type, inspectedRecord.quantity, inspectedRecord.normalized_unit)} tCO2e
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-esg-muted uppercase tracking-wider block">Status</span>
                <div className="mt-0.5">
                  <Badge variant={inspectedRecord.review_status.toLowerCase() as any}>
                    {inspectedRecord.review_status.toLowerCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-esg-muted leading-relaxed">
              <span className="font-semibold text-esg-dark">Source Ingestion:</span> {inspectedRecord.source_type} Ingestion
              <br />
              <span className="font-semibold text-esg-dark">Date Logged:</span> {new Date(inspectedRecord.created_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-esg-muted">
            The record was deleted or does not exist.
          </div>
        )}
      </Dialog>
    </div>
  );
};
