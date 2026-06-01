import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  FileSpreadsheet, 
  User, 
  Calendar, 
  HardDrive,
  ExternalLink,
  Eye,
  AlertTriangle
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";

// Skeleton rows rendered inside the real <Table> so every column aligns with its header.
const SkeletonTableRows: React.FC = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <TableRow key={i}>
        <TableCell className="pl-4 pr-2 py-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </TableCell>
        <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-14" /></TableCell>
        <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-12" /></TableCell>
        <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-14" /></TableCell>
        <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-20" /></TableCell>
        <TableCell className="px-2 py-3"><Skeleton className="h-3.5 w-24" /></TableCell>
        <TableCell className="px-2 py-3 min-w-[160px]">
          <div className="flex justify-start">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </TableCell>
        <TableCell className="pr-4 pl-2 py-3">
          <div className="flex items-center justify-end space-x-1.5">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export const UploadHistory: React.FC = () => {
  const { uploads, uploadsLoading, fetchUploads } = useESGData();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUpload, setSelectedUpload] = React.useState<any | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const isLoading = uploadsLoading && uploads.length === 0;

  const filteredHistory = uploads.filter((item) =>
    (item.file_name && item.file_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.source_type && item.source_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.uploaded_by && item.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInspectRecords = (fileName: string) => {
    navigate(`/review?search=${encodeURIComponent(fileName)}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-esg-dark font-sans">Data Ingestion History</h2>
        <p className="text-xs text-esg-muted mt-1">
          Review historical uploads, sheet file sizes, row parsing integrity, and validation statuses.
        </p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search uploaded files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-esg-muted" />}
            className="h-10 text-xs bg-esg-clay"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="whitespace-nowrap">
                <TableHead className="pl-4 pr-2 py-3 text-xs">File Name</TableHead>
                <TableHead className="px-2 py-3 text-xs">Source Type</TableHead>
                <TableHead className="px-2 py-3 text-xs">Size</TableHead>
                <TableHead className="px-2 py-3 text-xs">Parsed Rows</TableHead>
                <TableHead className="px-2 py-3 text-xs">Uploaded By</TableHead>
                <TableHead className="px-2 py-3 text-xs">Date Processed</TableHead>
                <TableHead className="px-2 py-3 text-xs min-w-[160px]">Validation Outcome</TableHead>
                <TableHead className="pr-4 pl-2 py-3 text-xs w-28" style={{ textAlign: "right" }}>Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonTableRows />
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-esg-muted">
                    No upload logs match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-esg-moss/10 transition-colors">
                    {/* File Name — plain, non-clickable */}
                    <TableCell className="pl-4 pr-2 py-2.5 font-semibold text-esg-dark max-w-[140px] whitespace-nowrap">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileSpreadsheet className="h-4 w-4 text-esg-muted shrink-0" />
                        <span className="truncate" title={item.file_name}>{item.file_name}</span>
                      </div>
                    </TableCell>

                    {/* Source Type */}
                    <TableCell className="capitalize text-xs text-esg-text whitespace-nowrap px-2 py-2.5">
                      {item.source_type.replace('_', ' ')}
                    </TableCell>

                    {/* File Size */}
                    <TableCell className="font-mono text-xs text-esg-muted shrink-0 whitespace-nowrap px-2 py-2.5">
                      <div className="flex items-center space-x-1">
                        <HardDrive className="h-3.5 w-3.5 text-esg-muted shrink-0" />
                        <span>{formatFileSize(item.file_size)}</span>
                      </div>
                    </TableCell>

                    {/* Parsed count */}
                    <TableCell className="font-mono text-xs text-esg-text whitespace-nowrap px-2 py-2.5">
                      {item.processing_summary?.row_count || 0} rows
                    </TableCell>

                    {/* Uploaded By */}
                    <TableCell className="text-xs text-esg-text whitespace-nowrap max-w-[120px] px-2 py-2.5">
                      <div className="flex items-center space-x-1 overflow-hidden" title={item.uploaded_by}>
                        <User className="h-3.5 w-3.5 text-esg-muted shrink-0" />
                        <span className="truncate">{item.uploaded_by.split('@')[0]}</span>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-esg-muted whitespace-nowrap px-2 py-2.5">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-esg-muted shrink-0" />
                        <span>
                          {new Date(item.upload_date).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-2 py-2.5 min-w-[160px]">
                      <div className="flex items-center justify-start gap-1.5 flex-nowrap">
                        <Badge 
                          className="px-1.5 py-0.5 text-[10px] shrink-0"
                          variant={
                            item.processing_status === 'COMPLETED' 
                              ? 'approved' 
                              : item.processing_status === 'PROCESSING' 
                              ? 'pending' 
                              : 'rejected'
                          }
                        >
                          {item.processing_status.toLowerCase()}
                        </Badge>
                        {(item.processing_summary?.anomalies || 0) > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0"
                            title={`${item.processing_summary?.anomalies} anomalous rows detected`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            {item.processing_summary?.anomalies} anomalies
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="pr-4 pl-2 py-2.5 whitespace-nowrap" style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Details button */}
                        <button
                          onClick={() => setSelectedUpload(item)}
                          className="p-1 rounded text-esg-muted hover:text-esg-dark hover:bg-esg-moss/50 transition-colors focus-ring"
                          title="View ingestion details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInspectRecords(item.file_name)}
                          className="h-7 text-[10px] space-x-1 px-2 bg-esg-clay border-esg-border/60 hover:bg-esg-moss/30"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="h-3 w-3 text-esg-muted" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        isOpen={selectedUpload !== null}
        onClose={() => setSelectedUpload(null)}
        title="File Ingestion Details"
      >
        {selectedUpload && (
          <div className="space-y-4 text-xs leading-normal">
            <div className="bg-esg-clay border border-esg-border/60 rounded-xl p-4 space-y-3">
              {/* File name — full row so long names stay on one line */}
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">File Name</span>
                <span
                  className="font-bold text-esg-dark whitespace-nowrap truncate mt-0.5 block"
                  title={selectedUpload.file_name}
                >
                  {selectedUpload.file_name}
                </span>
              </div>

              <div className="border-t border-esg-border/30 pt-2.5 grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Status</span>
                  <div className="mt-1">
                    <Badge variant={selectedUpload.processing_status === 'COMPLETED' ? 'approved' : selectedUpload.processing_status === 'PROCESSING' ? 'pending' : 'rejected'}>
                      {selectedUpload.processing_status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Source Type</span>
                  <span className="font-bold text-esg-dark uppercase mt-0.5 block">{selectedUpload.source_type}</span>
                </div>
              </div>

              <div className="border-t border-esg-border/30 pt-2.5 grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Facility</span>
                  <span className="font-bold text-esg-dark mt-0.5 block">{selectedUpload.facility?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">File Size</span>
                  <span className="font-bold text-esg-dark mt-0.5 block">{formatFileSize(selectedUpload.file_size)}</span>
                </div>
              </div>

              <div className="border-t border-esg-border/30 pt-2.5 grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Uploaded By</span>
                  <span className="font-bold text-esg-dark mt-0.5 block">{selectedUpload.uploaded_by}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Date Processed</span>
                  <span className="font-bold text-esg-dark mt-0.5 block">
                    {new Date(selectedUpload.upload_date).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-esg-border/30 pt-2.5">
                <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Processing Time</span>
                <span className="font-bold text-esg-dark mt-0.5 block">
                  {selectedUpload.processing_summary?.processing_duration || "N/A"}
                </span>
              </div>
            </div>

            {/* Ingestion metrics */}
            <div className="bg-esg-clay border border-esg-border/60 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-semibold text-esg-muted uppercase tracking-wider block">Rows Ingestion Statistics</span>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-esg-ivory rounded-lg p-2.5 border border-esg-border/30">
                  <span className="text-[10px] text-esg-muted block">Parsed</span>
                  <span className="text-sm font-bold text-esg-dark block mt-0.5">
                    {selectedUpload.processing_summary?.row_count || 0}
                  </span>
                </div>
                <div className="bg-esg-ivory rounded-lg p-2.5 border border-esg-border/30">
                  <span className="text-[10px] text-esg-muted block">Success</span>
                  <span className="text-sm font-bold text-green-700 block mt-0.5">
                    {selectedUpload.processing_summary?.successful_rows || 0}
                  </span>
                </div>
                <div className="bg-esg-ivory rounded-lg p-2.5 border border-esg-border/30">
                  <span className="text-[10px] text-esg-muted block">Failures</span>
                  <span className="text-sm font-bold text-rose-700 block mt-0.5">
                    {selectedUpload.processing_summary?.failed_rows || 0}
                  </span>
                </div>
                <div className="bg-esg-ivory rounded-lg p-2.5 border border-esg-border/30">
                  <span className="text-[10px] text-esg-muted block">Anomalies</span>
                  <span className="text-sm font-bold text-esg-sand block mt-0.5">
                    {selectedUpload.processing_summary?.anomalies || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedUpload(null)}
                className="h-9 px-4 bg-esg-clay text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedUpload(null);
                  handleInspectRecords(selectedUpload.file_name);
                }}
                className="h-9 px-4 text-xs bg-esg-sage hover:bg-esg-sage/80 text-esg-dark"
              >
                Inspect Records
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
