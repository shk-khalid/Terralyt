import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  Eye, 
  Check, 
  X, 
  Edit3, 
  AlertTriangle, 
  FileCode, 
  History, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Building, 
  Database, 
  TrendingUp 
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { useAuth } from "@/context/AuthContext";
import { getCalculatedEmissions } from "@/utils/emissions";
import { reviewService, type ReviewRecordDetail } from "@/services/reviewService";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";

export const ReviewQueue: React.FC = () => {
  const { 
    pendingRecords, 
    anomalies, 
    approveRecord, 
    rejectRecord, 
    correctRecord, 
    pendingRecordsLoading, 
    anomaliesLoading,
    fetchPendingRecords,
    fetchAnomalies
  } = useESGData();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Fetch pending records and anomalies on mount
  React.useEffect(() => {
    fetchPendingRecords();
    fetchAnomalies();
  }, [fetchPendingRecords, fetchAnomalies]);

  // Combine pending and anomalies list uniquely
  const records = React.useMemo(() => {
    const map = new Map();
    pendingRecords.forEach(r => map.set(r.id, r));
    anomalies.forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [pendingRecords, anomalies]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [facilityFilter, setFacilityFilter] = React.useState<string>("all");
  const [anomaliesOnly, setAnomaliesOnly] = React.useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Drawer / Modal states
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = React.useState<ReviewRecordDetail | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Edit fields
  const [editFacility, setEditFacility] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editQuantity, setEditQuantity] = React.useState(0);
  const [editUnit, setEditUnit] = React.useState("");

  React.useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "anomalies") {
      setAnomaliesOnly(true);
    }
  }, [searchParams]);

  // Load detailed record data when a record is selected
  React.useEffect(() => {
    if (selectedRecordId) {
      reviewService.getRecordDetail(selectedRecordId)
        .then(data => setSelectedRecordDetail(data))
        .catch(err => {
          console.error("Failed to load record details:", err);
          // Fallback to minimal state
          const basic = records.find(r => r.id === selectedRecordId);
          if (basic) {
            setSelectedRecordDetail({
              ...basic,
              audit_history: [],
              review_comments: []
            });
          }
        });
    } else {
      setSelectedRecordDetail(null);
    }
  }, [selectedRecordId, records]);

  // Selected Record Object (basic row data)
  const selectedRecord = React.useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Unique lists for selector filters (drawn from facility names)
  const facilitiesList = React.useMemo(() => {
    return Array.from(new Set(records.map(r => r.facility_name).filter(Boolean)));
  }, [records]);

  // Filter records
  const filteredRecords = React.useMemo(() => {
    return records.filter((rec) => {
      // Search matches
      const matchesSearch = 
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.facility_name && rec.facility_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.activity_type && rec.activity_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.source_type && rec.source_type.toLowerCase().includes(searchQuery.toLowerCase()));

      // Scope mapper: "SCOPE_1" -> 1, "SCOPE_2" -> 2, etc.
      const scopeVal = rec.scope === "SCOPE_1" ? 1 : rec.scope === "SCOPE_2" ? 2 : 3;
      const matchesScope = scopeFilter === "all" ? true : scopeVal === Number(scopeFilter);
      const matchesStatus = statusFilter === "all" ? true : rec.review_status === statusFilter;
      const matchesFacility = facilityFilter === "all" ? true : rec.facility_name === facilityFilter;
      const matchesAnomaly = anomaliesOnly ? rec.anomaly_flag : true;

      return matchesSearch && matchesScope && matchesStatus && matchesFacility && matchesAnomaly;
    });
  }, [records, searchQuery, scopeFilter, statusFilter, facilityFilter, anomaliesOnly]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, scopeFilter, statusFilter, facilityFilter, anomaliesOnly, itemsPerPage]);

  // Actions
  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      toast("Processing", "Submitting approval to ledger...", "info");
      await approveRecord(id);
      toast("Approved Successfully", `ESG Record ${id} signed off for reporting.`, "success");
    } catch (err) {
      toast("Error", "Could not complete approval step.", "error");
    }
  };

  const handleOpenReject = () => {
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedRecord || !user || !rejectReason.trim()) {
      toast("Required Fields Missing", "Please input a rejection justification.", "warning");
      return;
    }

    try {
      setIsRejectDialogOpen(false);
      toast("Processing", "Logging rejection reason...", "info");
      await rejectRecord(selectedRecord.id, rejectReason);
      toast("Record Rejected", `ESG Record ${selectedRecord.id} has been flagged as REJECTED.`, "warning");
    } catch (err) {
      toast("Error", "Could not submit audit decision.", "error");
    }
  };

  const handleOpenEdit = () => {
    if (!selectedRecord) return;
    setEditFacility(selectedRecord.facility_name || "");
    setEditCategory(selectedRecord.activity_type || "");
    setEditQuantity(selectedRecord.quantity);
    setEditUnit(selectedRecord.normalized_unit);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRecord || !user) return;
    if (!editFacility.trim() || !editCategory.trim() || editQuantity <= 0 || !editUnit.trim()) {
      toast("Validation Error", "All adjustment fields must contain valid parameters.", "warning");
      return;
    }

    try {
      setIsEditDialogOpen(false);
      toast("Saving", "Writing adjustments and recalculating carbon values...", "info");
      
      await correctRecord(selectedRecord.id, {
        quantity: editQuantity,
        normalized_unit: editUnit,
        unit: editUnit,
      });
      toast("Record Adjusted", `ESG Record ${selectedRecord.id} revised and emissions recalculated.`, "success");
    } catch (err) {
      toast("Adjustment Failed", "Check database write permission logs.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-esg-dark font-sans">ESG Record Audit Queue</h2>
          <p className="text-xs text-esg-muted mt-1">
            Audit and approve raw greenhouse gas source entries. Adjust inputs inline to recalculate emission values.
          </p>
        </div>
      </div>

      {/* Metrics summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-esg-clay border border-esg-moss/60 rounded-xl p-4 flex items-center justify-between shadow-soft hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Pending Audit</span>
            <span className="text-2xl font-extrabold text-esg-dark block">
              {records.filter(r => r.review_status === 'PENDING').length} entries
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-esg-sage/20 border border-esg-sage/35 flex items-center justify-center text-esg-muted shrink-0">
            <Activity className="h-5 w-5 text-esg-muted" />
          </div>
        </div>
        
        <div className="bg-esg-clay border border-esg-moss/60 rounded-xl p-4 flex items-center justify-between shadow-soft hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Active Anomalies</span>
            <span className="text-2xl font-extrabold text-esg-sand block">
              {records.filter(r => r.anomaly_flag && r.review_status === 'PENDING').length} flags
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-esg-sand/20 border border-esg-sand/35 flex items-center justify-center text-esg-sand shrink-0 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-esg-sand" />
          </div>
        </div>
        
        <div className="bg-esg-clay border border-esg-moss/60 rounded-xl p-4 flex items-center justify-between shadow-soft hover:scale-[1.01] transition-transform duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Signed Off</span>
            <span className="text-2xl font-extrabold text-esg-dark block">
              {records.filter(r => r.review_status === 'APPROVED').length} verified
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-esg-sage/30 border border-esg-sage/55 flex items-center justify-center text-esg-dark shrink-0">
            <History className="h-5 w-5 text-esg-text" />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="relative overflow-visible z-20">
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Scope Level"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="h-9 text-xs bg-esg-ivory"
            >
              <option value="all">All Scopes</option>
              <option value="1">Scope 1 (Direct Fuels)</option>
              <option value="2">Scope 2 (Electricity/Grid)</option>
              <option value="3">Scope 3 (Corporate Travel)</option>
            </Select>

            <Select
              label="Auditing Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 text-xs bg-esg-ivory"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Audit</option>
              <option value="APPROVED">Approved / Disclosed</option>
              <option value="REJECTED">Flagged Rejected</option>
            </Select>

            <Select
              label="Origin Facility"
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="h-9 text-xs bg-esg-ivory"
            >
              <option value="all">All Facilities</option>
              {facilitiesList.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Grid Table */}
      <Card className="overflow-hidden">
        {/* Table Header Section containing Search and Anomalies */}
        <div className="px-6 py-4 border-b border-esg-moss/50 bg-esg-clay/40 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0">
            <h3 className="text-sm font-bold text-esg-dark uppercase tracking-wider whitespace-nowrap">Ingestion Log</h3>
            <span className="bg-esg-sage/30 text-esg-dark text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {filteredRecords.length} records
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="w-full sm:w-[320px]">
              <Input
                placeholder="Search by facility, category, file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4 text-esg-muted" />}
                className="h-9 text-xs bg-esg-ivory"
              />
            </div>
            {/* Anomalies Only Checkbox */}
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-esg-text select-none shrink-0">
              <input
                type="checkbox"
                checked={anomaliesOnly}
                onChange={(e) => setAnomaliesOnly(e.target.checked)}
                className="h-4 w-4 rounded border-esg-border text-esg-sage focus:ring-esg-sage cursor-pointer"
              />
              <span>Anomalies Only</span>
            </label>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr>
                <TableHead className="pl-6 w-32">Record ID</TableHead>
                <TableHead>Origin Facility</TableHead>
                <TableHead className="hidden lg:table-cell">Ingestion Source</TableHead>
                <TableHead className="w-24">Scope</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right w-36">Activity Input</TableHead>
                <TableHead className="text-right w-32">Emissions</TableHead>
                <TableHead className="text-center w-36">Audit Status</TableHead>
                <TableHead className="text-right pr-6 w-28">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {(pendingRecordsLoading || anomaliesLoading) && records.length === 0 ? (
                [...Array(itemsPerPage)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-3.5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-3.5 w-24 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-16 rounded-full mx-auto" />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Skeleton className="h-7 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-xs text-esg-muted">
                    No active records match the filter query.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((rec) => {
                  const scopeNum = rec.scope === "SCOPE_1" ? 1 : rec.scope === "SCOPE_2" ? 2 : 3;
                  const emissionsVal = getCalculatedEmissions(rec.activity_type, rec.quantity, rec.normalized_unit);
                  return (
                    <TableRow 
                      key={rec.id} 
                      className={`cursor-pointer border-b border-esg-moss/20 transition-all duration-150 ${
                        selectedRecordId === rec.id 
                          ? 'bg-esg-moss/25 hover:bg-esg-moss/35 font-medium' 
                          : 'hover:bg-esg-moss/10'
                      } ${rec.anomaly_flag ? 'border-l-[5px] border-l-esg-sand bg-esg-sand/12 hover:bg-esg-sand/20' : ''}`}
                      onClick={() => setSelectedRecordId(rec.id)}
                    >
                      {/* ID */}
                      <TableCell className="pl-6 font-bold text-esg-dark">
                        {rec.id.substring(0, 8)}...
                      </TableCell>
                      
                      {/* Facility */}
                      <TableCell className="font-semibold text-esg-dark">
                        {rec.facility_name}
                      </TableCell>

                      {/* Source */}
                      <TableCell className="hidden lg:table-cell text-xs text-esg-muted max-w-[140px] truncate">
                        {rec.source_type} Ingestion
                      </TableCell>

                      {/* Scope Badge */}
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={`scope${scopeNum}` as any}>
                          Scope {scopeNum}
                        </Badge>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="text-xs font-medium uppercase">
                        {rec.activity_type}
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-right font-mono text-xs">
                        {Number(rec.quantity).toLocaleString()} {rec.normalized_unit}
                      </TableCell>

                      {/* Calculated tCO2e */}
                      <TableCell className="text-right font-bold font-mono text-xs text-esg-dark">
                        {emissionsVal} tCO2e
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Badge variant={rec.review_status.toLowerCase() as any}>
                            {rec.review_status.toLowerCase()}
                          </Badge>
                          {rec.anomaly_flag && (
                            <span className="inline-flex items-center text-[8px] font-bold text-esg-sand uppercase tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                              Anomaly
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedRecordId(rec.id)}
                            className="p-1.5 rounded-full text-esg-muted hover:text-esg-dark hover:bg-esg-moss/45 transition-colors focus-ring"
                            title="Open details drawer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {rec.review_status === 'PENDING' && (
                            <>
                               <button
                                 onClick={() => handleApprove(rec.id)}
                                 className="p-1.5 rounded-full text-emerald-700/60 hover:text-emerald-800 hover:bg-emerald-600/5 transition-colors focus-ring"
                                 title="Approve record"
                               >
                                 <Check className="h-4 w-4" />
                               </button>
                               <button
                                 onClick={() => {
                                   setSelectedRecordId(rec.id);
                                   handleOpenReject();
                                 }}
                                 className="p-1.5 rounded-full text-rose-700/60 hover:text-rose-800 hover:bg-rose-600/5 transition-colors focus-ring"
                                 title="Reject record"
                               >
                                 <X className="h-4 w-4" />
                               </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-xs px-2 select-none">
        <div className="flex items-center space-x-4">
          <span className="text-esg-muted font-medium">
            Showing Page <strong className="text-esg-dark">{currentPage}</strong> of <strong className="text-esg-dark">{totalPages}</strong> ({filteredRecords.length} records filtered)
          </span>
          <div className="flex items-center space-x-1.5 text-esg-muted">
            <span>Show</span>
            <div className="w-28 relative">
              <Select
                value={String(itemsPerPage)}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                position="top"
                className="h-8 py-1.5 px-2.5 text-xs bg-esg-ivory"
              >
                <option value="10">10 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 px-2 bg-esg-ivory hover:bg-esg-moss/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-2 bg-esg-ivory hover:bg-esg-moss/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right details drawer */}
      <Drawer
        isOpen={selectedRecordId !== null && selectedRecord !== null}
        onClose={() => setSelectedRecordId(null)}
        title={selectedRecord ? `Audit Record: ${selectedRecord.id.substring(0, 8)}...` : ""}
        description={selectedRecord ? `Source Ingestion Pipeline: ${selectedRecord.source_type}` : ""}
      >
        {selectedRecord && (
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3 w-full bg-esg-moss/30 p-1 rounded-xl">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="raw" className="text-xs">Raw Payload</TabsTrigger>
              <TabsTrigger value="audit" className="text-xs">Audit Logs</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-4 pt-2">
              
              {/* Validation errors/warnings */}
              {selectedRecord.anomaly_flag && selectedRecord.anomaly_reason && (
                <div className="space-y-2.5">
                  <div className="p-3.5 border rounded-xl flex items-start space-x-3 shadow-soft bg-esg-sand/10 border-esg-sand/45 text-esg-sand">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block">
                        Compliance Warning / Anomaly
                      </span>
                      <p className="text-xs text-esg-text font-medium mt-1 leading-relaxed">
                        {selectedRecord.anomaly_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI metrics in drawer */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Origin Facility Card */}
                <div className="bg-esg-clay/35 border border-esg-moss/50 rounded-xl p-3 flex items-center justify-between shadow-soft hover:scale-[1.02] transition-transform duration-200">
                  <div>
                    <span className="text-[9px] font-bold text-esg-muted uppercase tracking-wider block">Origin Facility</span>
                    <span className="text-xs font-extrabold text-esg-dark block mt-0.5">{selectedRecord.facility_name}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-esg-moss/20 border border-esg-moss/45 flex items-center justify-center text-esg-muted shrink-0 ml-2">
                    <Building className="h-4 w-4" />
                  </div>
                </div>

                {/* Scope Level Card */}
                <div className="bg-esg-clay/35 border border-esg-moss/50 rounded-xl p-3 flex items-center justify-between shadow-soft hover:scale-[1.02] transition-transform duration-200">
                  {(() => {
                    const scopeNum = selectedRecord.scope === "SCOPE_1" ? 1 : selectedRecord.scope === "SCOPE_2" ? 2 : 3;
                    return (
                      <>
                        <div>
                          <span className="text-[9px] font-bold text-esg-muted uppercase tracking-wider block">Scope Level</span>
                          <span className="text-xs font-extrabold text-esg-dark block mt-0.5">Scope {scopeNum}</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-esg-sage/20 border border-esg-sage/45 flex items-center justify-center text-esg-muted shrink-0 ml-2">
                          <Database className="h-4 w-4" />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Raw Quantity Card */}
                <div className="bg-esg-clay/35 border border-esg-moss/50 rounded-xl p-3 flex items-center justify-between shadow-soft hover:scale-[1.02] transition-transform duration-200">
                  <div>
                    <span className="text-[9px] font-bold text-esg-muted uppercase tracking-wider block">Raw Quantity</span>
                    <span className="text-xs font-extrabold text-esg-dark block mt-0.5 truncate max-w-[90px]" title={`${Number(selectedRecord.quantity).toLocaleString()} ${selectedRecord.normalized_unit}`}>
                      {Number(selectedRecord.quantity).toLocaleString()} {selectedRecord.normalized_unit}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-esg-moss/25 border border-esg-moss/50 flex items-center justify-center text-esg-muted shrink-0 ml-2">
                    <FileCode className="h-4 w-4" />
                  </div>
                </div>

                {/* Emissions Weight Card */}
                <div className="bg-esg-clay/35 border border-esg-moss/50 rounded-xl p-3 flex items-center justify-between shadow-soft hover:scale-[1.02] transition-transform duration-200">
                  <div>
                    <span className="text-[9px] font-bold text-esg-muted uppercase tracking-wider block">Emissions Weight</span>
                    <span className="text-xs font-extrabold text-esg-dark block mt-0.5">
                      {getCalculatedEmissions(selectedRecord.activity_type, selectedRecord.quantity, selectedRecord.normalized_unit)} tCO2e
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-esg-sage/35 border border-esg-sage/60 flex items-center justify-center text-esg-text shrink-0 ml-2">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Ingestion Meta info */}
              <div className="text-xs space-y-3 text-esg-muted p-4 bg-esg-clay/20 border border-esg-moss/30 rounded-xl mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-esg-muted">Source Ingestion Type</span>
                  <span className="font-semibold text-esg-text font-mono text-[11px]">
                    {selectedRecord.source_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-esg-muted">Activity Date</span>
                  <span className="font-semibold text-esg-text">{selectedRecord.activity_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-esg-muted">Audit Status</span>
                  <span className="font-semibold text-esg-text">
                    <Badge variant={selectedRecord.review_status.toLowerCase() as any}>{selectedRecord.review_status.toLowerCase()}</Badge>
                  </span>
                </div>
                {selectedRecord.anomaly_flag && selectedRecord.anomaly_reason && (
                  <div className="mt-3 p-3 bg-esg-sand/15 border border-esg-sand/40 rounded-xl">
                    <div className="flex items-center space-x-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-esg-sand animate-pulse" />
                      <span className="text-[9px] font-bold text-esg-sand uppercase tracking-wider">Flagged Anomaly Reason</span>
                    </div>
                    <p className="text-esg-text font-medium text-[11px] mt-1.5 leading-relaxed">{selectedRecord.anomaly_reason}</p>
                  </div>
                )}
              </div>

              {/* Action buttons footer inside drawer */}
              <div className="pt-6 border-t border-esg-moss/40 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenEdit}
                  className="space-x-1.5 text-xs bg-esg-clay"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Adjust Fields</span>
                </Button>
                {selectedRecord.review_status === 'PENDING' && (
                  <>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={handleOpenReject}
                       className="text-xs bg-rose-50/20 border border-rose-200/30 text-rose-800/60 hover:bg-rose-50/40 hover:border-rose-300/50 hover:text-rose-800/80"
                     >
                       Reject Entry
                     </Button>
                     <Button 
                       onClick={() => handleApprove(selectedRecord.id)}
                       size="sm"
                       className="text-xs bg-emerald-700/70 hover:bg-emerald-700/85 text-white/90 hover:text-white border border-emerald-700/10 active:bg-emerald-800/90 shadow-sm"
                     >
                       Sign off & Disclose
                     </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: RAW PAYLOAD */}
            <TabsContent value="raw" className="space-y-4 pt-2">
              <div className="flex items-center space-x-2 text-xs text-esg-muted">
                <FileCode className="h-4 w-4" />
                <span>Original parsed payload as received by the network parser.</span>
              </div>
              <pre className="bg-esg-clay text-esg-text p-4 rounded-xl text-xs font-mono overflow-auto border border-esg-border/50 max-h-96 leading-relaxed select-all">
                {JSON.stringify(selectedRecord.raw_payload, null, 2)}
              </pre>
            </TabsContent>

            {/* TAB 3: AUDIT TIMELINE */}
            <TabsContent value="audit" className="space-y-4 pt-2">
              <div className="flex items-center space-x-2 text-xs text-esg-muted">
                <History className="h-4 w-4" />
                <span>Chronological action sequence for compliance disclosure reporting.</span>
              </div>
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-esg-moss/50 pl-8 pt-2">
                {selectedRecordDetail?.audit_history && selectedRecordDetail.audit_history.length > 0 ? (
                  selectedRecordDetail.audit_history.map((evt) => (
                    <div key={evt.id} className="relative text-xs leading-normal">
                      {/* Circle icon */}
                      <span className="absolute left-[-26px] top-1.5 h-3.5 w-3.5 rounded-full bg-esg-sage flex items-center justify-center border-2 border-esg-ivory">
                        <Activity className="h-2 w-2 text-esg-dark" />
                      </span>
                      <div className="font-semibold text-esg-dark flex items-center space-x-2">
                        <span>{evt.action_type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-esg-muted font-normal">by {evt.actor}</span>
                      </div>
                      <p className="text-esg-muted mt-1">
                        {evt.old_value ? `Changed: ${JSON.stringify(evt.old_value)} → ${JSON.stringify(evt.new_value)}` : 'Created record.'}
                      </p>
                      <span className="text-[9px] text-esg-muted block mt-1">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-esg-muted text-xs">No audit events logged for this record.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Drawer>

      {/* Reject reason Dialog */}
      <Dialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        title="Flag Record Rejection"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRejectDialogOpen(false)} className="bg-esg-clay">
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
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Recalibrate Data Inputs"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="bg-esg-clay">
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
