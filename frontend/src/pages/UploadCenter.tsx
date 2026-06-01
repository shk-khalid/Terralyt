import * as React from "react";
import { Link } from "react-router-dom";
import { 
  UploadCloud, 
  CheckCircle, 
  Database,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";

export const UploadCenter: React.FC = () => {
  const { facilities, registerUpload } = useESGData();
  const { user } = useAuth();
  
  const [sourceType, setSourceType] = React.useState<'sap_erp' | 'utility_bill' | 'travel_log' | 'custom_csv'>('utility_bill');
  const [selectedFacilityId, setSelectedFacilityId] = React.useState<string>("");
  const [dragActive, setDragActive] = React.useState(false);
  // File selected but not yet uploaded
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  // File currently being uploaded
  const [uploadingFile, setUploadingFile] = React.useState<File | null>(null);
  
  // Progress tracking states
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [ingestStage, setIngestStage] = React.useState<'uploading' | 'parsing' | 'validating' | 'done' | 'idle'>('idle');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Guard to prevent StrictMode double-firing of the ingestion pipeline
  const ingestionGuardRef = React.useRef(false);

  // Set default facility once facilities load
  React.useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const startIngestionProcess = async (file: File) => {
    if (!user || !selectedFacilityId) {
      toast("Facility Required", "Please select a facility for the upload location.", "warning");
      return;
    }
    ingestionGuardRef.current = false;
    setUploadingFile(file);
    setIngestStage('uploading');
    setUploadProgress(15);

    // Simulated progress transitions
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          // Guard: only advance once per ingestion cycle
          if (!ingestionGuardRef.current) {
            ingestionGuardRef.current = true;
            setIngestStage('parsing');
            startParsingStage(file);
          }
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const startParsingStage = (file: File) => {
    setTimeout(() => {
      setIngestStage('validating');
      startValidationStage(file);
    }, 600);
  };

  const startValidationStage = async (file: File) => {
    setTimeout(async () => {
      try {
        // Map UI source type to backend source type
        const backendSourceMap: Record<string, string> = {
          sap_erp: 'SAP',
          utility_bill: 'UTILITY',
          travel_log: 'TRAVEL',
          custom_csv: 'SAP'
        };
        const mappedSource = backendSourceMap[sourceType] || 'UTILITY';

        await registerUpload({
          facility_id: selectedFacilityId,
          source_type: mappedSource,
          file: file,
          file_name: file.name
        });
        
        setIngestStage('done');
        toast(
          "Ingestion Complete", 
          `Uploaded ${file.name} successfully. Pipeline triggered.`, 
          "success"
        );
      } catch (err) {
        setIngestStage('idle');
        setUploadingFile(null);
        toast("Ingestion Failed", "Backend pipeline rejected ingestion.", "error");
      }
    }, 700);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPendingFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPendingFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetUploadCenter = () => {
    setUploadingFile(null);
    setPendingFile(null);
    setIngestStage('idle');
    setUploadProgress(0);
    ingestionGuardRef.current = false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-esg-dark">ESG Ingestion Center</h2>
        <p className="text-xs text-esg-muted mt-1">
          Upload activity files from SAP ERPs, PGE utility scans, or airline itineraries.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Upload Form Area */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>File Ingestion Pipeline</CardTitle>
            <CardDescription>
              Select target facility, source type, and upload raw CSV/XLSX spreadsheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {facilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[300px]">
                <div className="h-12 w-12 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-sm">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12" y2="16" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-esg-dark uppercase tracking-wider">No Facilities Registered</h4>
                  <p className="text-xs text-esg-muted max-w-sm leading-relaxed">
                    You must register at least one physical location or facility in your profile directory before you can upload and ingest ESG spreadsheets.
                  </p>
                </div>
                <Link to="/facilities" className="pt-2">
                  <Button size="sm" className="space-x-1.5">
                    <span>Manage Facilities</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : ingestStage === 'idle' ? (
                <>
                  {/* Facility and Source selectors */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-xl">
                    <Select 
                      label="Target Facility"
                      value={selectedFacilityId}
                      onChange={(e) => setSelectedFacilityId(e.target.value)}
                    >
                      {facilities.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} ({fac.location})
                        </option>
                      ))}
                    </Select>

                    <Select 
                      label="Data Ingestion Source"
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as any)}
                    >
                      <option value="utility_bill">Utility Invoices (CSV - Scope 2 Electricity)</option>
                      <option value="sap_erp">SAP ERP Fleet Mileage (CSV - Scope 1 Fuels)</option>
                      <option value="travel_log">Corporate Travel Itineraries (CSV - Scope 3 Flight Miles)</option>
                    </Select>
                  </div>

                  {/* Drag and Drop Box */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                      dragActive 
                        ? "border-esg-sand bg-esg-moss/30" 
                        : "border-esg-border hover:border-esg-sage hover:bg-esg-moss/10"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                    />
                    <div className="h-12 w-12 rounded-full bg-esg-moss flex items-center justify-center mb-4">
                      <UploadCloud className="h-6 w-6 text-esg-dark" />
                    </div>
                    <h4 className="text-sm font-semibold text-esg-dark">
                      Drag and drop file here, or click to browse
                    </h4>
                    <p className="text-xs text-esg-muted mt-2 max-w-xs leading-normal">
                      Supports .CSV and .XLSX spreadsheets. Max file size: 10MB.
                    </p>
                  </div>

                  {/* Confirmation Dialog */}
                  <Dialog
                    isOpen={!!pendingFile}
                    onClose={() => setPendingFile(null)}
                    title="Confirm File Upload"
                    footer={
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setPendingFile(null)}
                          className="bg-esg-ivory"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (pendingFile) {
                              setUploadingFile(pendingFile);
                              startIngestionProcess(pendingFile);
                              setPendingFile(null);
                            }
                          }}
                        >
                          Confirm Upload
                        </Button>
                      </>
                    }
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-esg-muted">File</span>
                        <span className="font-medium text-esg-dark">{pendingFile?.name} ({pendingFile ? (pendingFile.size / 1024).toFixed(0) : 0} KB)</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-esg-muted">Target Facility</span>
                        <span className="font-medium text-esg-dark">
                          {facilities.find((f) => f.id === selectedFacilityId)?.name ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-esg-muted">Ingestion Source</span>
                        <span className="font-medium text-esg-dark">
                          {{ utility_bill: "Utility Invoices", sap_erp: "SAP ERP Fleet Mileage", travel_log: "Corporate Travel Itineraries", custom_csv: "Custom CSV" }[sourceType]}
                        </span>
                      </div>
                    </div>
                  </Dialog>
                </>
              ) : (
              /* Uploading & Progress Processing Screen */
              <div className="border border-esg-moss/50 rounded-2xl p-8 bg-esg-moss/10 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
                
                {/* Spinner or Success Icon */}
                {ingestStage !== 'done' ? (
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-esg-sage animate-spin" />
                    <span className="absolute text-[10px] font-bold text-esg-dark">
                      {ingestStage === 'uploading' ? `${uploadProgress}%` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-esg-sage/30 flex items-center justify-center animate-bounce">
                    <CheckCircle className="h-8 w-8 text-esg-dark" />
                  </div>
                )}

                {/* Info Text */}
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-esg-dark">
                    {ingestStage === 'uploading' && `Uploading ${uploadingFile?.name}...`}
                    {ingestStage === 'parsing' && "Extracting spreadsheet data fields..."}
                    {ingestStage === 'validating' && "Running EPA emissions factors validator..."}
                    {ingestStage === 'done' && "File Ingestion Completed Successfully"}
                  </h4>
                  
                  {/* Pipeline Stage Indicators */}
                  <div className="flex flex-col space-y-1.5 text-xs text-esg-muted font-medium w-full max-w-xs mx-auto text-left pt-2">
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        ingestStage !== 'uploading' ? 'bg-esg-sage' : 'bg-esg-sand animate-pulse'
                      }`} />
                      <span>Upload to cloud server ({uploadingFile?.size ? `${(uploadingFile.size / 1024).toFixed(0)} KB` : 'calculating...'})</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        ingestStage === 'validating' || ingestStage === 'done'
                          ? 'bg-esg-sage' 
                          : ingestStage === 'parsing' 
                          ? 'bg-esg-sand animate-pulse' 
                          : 'bg-esg-border'
                      }`} />
                      <span>Parse rows and column headers</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        ingestStage === 'done' 
                          ? 'bg-esg-sage' 
                          : ingestStage === 'validating' 
                          ? 'bg-esg-sand animate-pulse' 
                          : 'bg-esg-border'
                      }`} />
                      <span>Validate greenhouse gas coefficients</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {ingestStage === 'uploading' && (
                  <div className="w-full max-w-xs h-2 bg-esg-moss rounded-full overflow-hidden shadow-inner-soft">
                    <div 
                      className="bg-esg-sage h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Done Controls */}
                {ingestStage === 'done' && (
                  <div className="flex items-center justify-center space-x-4 pt-4">
                    <Button onClick={resetUploadCenter} variant="outline" className="text-xs bg-esg-ivory hover:bg-esg-moss/30">
                      Upload Another File
                    </Button>
                    <Link to="/review">
                      <Button className="text-xs space-x-1.5">
                        <span>Go to Review Queue</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-4 w-4 mr-2 text-esg-muted" />
                Ingestion Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-esg-muted">
              <div>
                <span className="font-semibold text-esg-dark block mb-1">Utility Bills (CSV)</span>
                We support electric utilities PG&E and Vattenfall natural gas invoices. The system automatically converts kWh and cubic meters.
              </div>
              
              <div>
                <span className="font-semibold text-esg-dark block mb-1">SAP ERP Fleet Mileage (CSV)</span>
                Tracks company cars, medium/heavy transport fuel cards (Diesel and gasoline). Calculates direct Scope 1 values.
              </div>

              <div>
                <span className="font-semibold text-esg-dark block mb-1">Travel Logs (CSV)</span>
                Ingest corporate airline itineraries in standard passenger-miles. Supports short-haul and long-haul radiative forcing factor multipliers.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
