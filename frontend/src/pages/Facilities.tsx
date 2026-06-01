import * as React from "react";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { type Facility } from "@/services/facilityService";

export const Facilities: React.FC = () => {
  const { 
    facilities, 
    facilitiesLoading, 
    createFacility, 
    updateFacility, 
    deleteFacility 
  } = useESGData();

  // Feature flag to indicate APIs are not ready yet
  const API_COMING_SOON = false;

  // Search & Filters state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("ALL");

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [facilityToEdit, setFacilityToEdit] = React.useState<Facility | null>(null);
  const [name, setName] = React.useState("");
  const [facilityType, setFacilityType] = React.useState("Office");
  const [location, setLocation] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Delete Modal state
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [facilityToDelete, setFacilityToDelete] = React.useState<Facility | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Filter facilities based on search query & facility type
  const filteredFacilities = React.useMemo(() => {
    return facilities.filter((fac) => {
      const matchesSearch = 
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = 
        selectedType === "ALL" || 
        fac.facility_type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [facilities, searchQuery, selectedType]);

  const handleOpenAdd = () => {
    setFacilityToEdit(null);
    setName("");
    setFacilityType("Office");
    setLocation("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (facility: Facility) => {
    setFacilityToEdit(facility);
    setName(facility.name);
    setFacilityType(facility.facility_type);
    setLocation(facility.location);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (facility: Facility) => {
    setFacilityToDelete(facility);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Validation Error", "Facility name is required.", "warning");
      return;
    }
    if (!location.trim()) {
      toast("Validation Error", "Facility location is required.", "warning");
      return;
    }

    setSaving(true);
    try {
      if (facilityToEdit) {
        // Updating existing facility
        await updateFacility(facilityToEdit.id, {
          name: name.trim(),
          facility_type: facilityType,
          location: location.trim(),
        });
        toast("Facility Updated", `Successfully updated "${name.trim()}".`, "success");
      } else {
        // Creating new facility
        await createFacility({
          name: name.trim(),
          facility_type: facilityType,
          location: location.trim(),
        });
        toast("Facility Created", `Successfully created "${name.trim()}".`, "success");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to save facility details.";
      toast("Saving Failed", errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!facilityToDelete) return;
    setDeleting(true);
    try {
      await deleteFacility(facilityToDelete.id);
      toast("Facility Deleted", `Successfully removed "${facilityToDelete.name}".`, "success");
      setIsDeleteOpen(false);
      setFacilityToDelete(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to delete facility.";
      toast("Deletion Failed", errMsg, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Helper to assign a badge color based on facility type
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "office":
        return "default";
      case "factory":
        return "scope3";
      case "warehouse":
        return "scope2";
      case "data center":
      case "datacenter":
        return "scope1";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-esg-dark">Facility Directory</h1>
          <p className="text-xs text-esg-muted mt-1">
            Manage your physical facilities, offices, and factories. Track locations and types for tenant isolation.
          </p>
        </div>
          {API_COMING_SOON ? (
            <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-md flex items-center space-x-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12" y2="16" /></svg>
              <span className="font-medium">Facility Management API is coming soon. Adding facilities is disabled.</span>
            </div>
          ) : (
            <Button 
              onClick={handleOpenAdd}
              className="flex items-center space-x-2 shrink-0 self-start md:self-center"
            >
              <Plus className="h-4 w-4" />
              <span>Add Facility</span>
            </Button>
          )}
      </div>

      {/* Directory Table Grid */}
      <Card className="bg-esg-clay border border-esg-moss/50 shadow-soft overflow-hidden">
        {/* Table Header Section containing Search and Category Filters */}
        <div className="px-6 py-4 border-b border-esg-moss/50 bg-esg-clay/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0">
            <h3 className="text-sm font-bold text-esg-dark uppercase tracking-wider">Facility List</h3>
            <span className="bg-esg-sage/30 text-esg-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredFacilities.length} locations
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by facility name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4 text-esg-muted" />}
                className="bg-esg-ivory border-esg-border/60"
              />
            </div>
            {/* Type Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-esg-ivory border-esg-border/60"
              >
                <option value="ALL">All Types</option>
                <option value="Office">Office</option>
                <option value="Factory">Factory</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Data Center">Data Center</option>
                <option value="Retail">Retail</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
        </div>

        {facilitiesLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4">
            <Loader2 className="h-8 w-8 text-esg-muted animate-spin" />
            <p className="text-xs text-esg-muted">Loading facility registry database...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-esg-moss/30 flex items-center justify-center text-esg-muted shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-esg-dark">No Facilities Registered</p>
              <p className="text-xs text-esg-muted mt-1 max-w-sm leading-relaxed">
                You haven't registered any offices, factories, or warehouses yet. Provision your first facility to start ingestion.
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleOpenAdd}
              className="mt-2 shadow-sm"
            >
              Add First Facility
            </Button>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-esg-moss/20 flex items-center justify-center text-esg-muted">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-esg-dark">No Search Results</p>
              <p className="text-xs text-esg-muted mt-1 max-w-sm leading-relaxed">
                No facilities match your search query "{searchQuery}" or selected category filter. Try adjusting your query parameters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Facility Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell className="font-semibold text-esg-dark">
                      <div className="flex items-center space-x-2.5">
                        <Building2 className="h-4 w-4 text-esg-muted shrink-0" />
                        <span className="truncate">{fac.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(fac.facility_type)}>
                        {fac.facility_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1.5 text-xs text-esg-text">
                        <MapPin className="h-3.5 w-3.5 text-esg-muted shrink-0" />
                        <span className="truncate">{fac.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-esg-muted">
                      {new Date(fac.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {API_COMING_SOON ? null : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(fac)}
                      className="h-8 w-8 text-esg-muted hover:text-esg-dark"
                      title="Edit facility parameters"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(fac)}
                      className="h-8 w-8 text-esg-muted hover:text-red-700 hover:bg-rose-50/50"
                      title="Soft delete facility"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Add / Edit Dialog Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={facilityToEdit ? "Edit Facility Parameters" : "Provision New Facility"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setIsFormOpen(false)}
              className="bg-esg-clay"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={handleFormSubmit}
              className="min-w-[80px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : facilityToEdit ? (
                "Save Changes"
              ) : (
                "Create Facility"
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Facility Name"
            placeholder="e.g. Austin Manufacturing Plant"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            required
            className="bg-esg-ivory"
          />
          <Select
            label="Facility Type"
            value={facilityType}
            onChange={(e) => setFacilityType(e.target.value)}
            disabled={saving}
            className="bg-esg-ivory"
          >
            <option value="Office">Office</option>
            <option value="Factory">Factory</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Data Center">Data Center</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            label="Location"
            placeholder="e.g. Austin, Texas, USA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={saving}
            required
            className="bg-esg-ivory"
          />
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog Modal */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Soft Deletion"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setIsDeleteOpen(false)}
              className="bg-esg-clay"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="bg-esg-sand text-white hover:bg-opacity-90 min-w-[80px]"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Delete Location"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-esg-text">
            Are you sure you want to deactivate and soft-delete the following facility?
          </p>
          {facilityToDelete && (
            <div className="p-3 bg-esg-moss/20 border border-esg-moss/50 rounded-xl space-y-1">
              <p className="font-semibold text-esg-dark text-xs">{facilityToDelete.name}</p>
              <p className="text-[11px] text-esg-muted">
                {facilityToDelete.facility_type} &bull; {facilityToDelete.location}
              </p>
            </div>
          )}
          <p className="text-xs text-esg-muted">
            This action isolates the facility from further audits. Existing historical disclosure records will remain intact in compliance ledger records.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
