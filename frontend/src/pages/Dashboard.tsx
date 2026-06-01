import * as React from "react";
import { Link } from "react-router-dom";
import { 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  ArrowRight,
  Database,
  Building,
  CheckCircle
} from "lucide-react";
import { useESGData } from "@/context/ESGDataContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";

const formatShortNumber = (num: number): string => {
  const n = Number(num) || 0;
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return n.toLocaleString();
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Panel Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Grid of Key Widgets Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Total Records */}
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full ml-3" />
          </div>
        </Card>
        {/* Pending Reviews */}
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full ml-3" />
          </div>
        </Card>
        {/* Approved Records */}
        <Card className="col-span-1 md:col-span-2">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full ml-3" />
          </div>
        </Card>
        {/* Anomalies */}
        <Card className="col-span-1 md:col-span-3">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full ml-3" />
          </div>
        </Card>
        {/* Processing Time */}
        <Card className="col-span-1 md:col-span-3">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full ml-3" />
          </div>
        </Card>
      </div>

      {/* Main Charts Section Skeleton */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Ingestion Trend Area Chart Skeleton */}
        <Card className="min-h-[350px] flex flex-col justify-between lg:col-span-2">
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6">
            <div className="w-full h-48 rounded-xl border border-esg-moss/10 flex items-end p-4 space-x-4">
              <div className="w-full h-full flex items-end justify-between px-4">
                {[40, 60, 45, 80, 50, 75, 90, 65].map((h, idx) => (
                  <Skeleton key={idx} className="w-8 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scope Donut Chart Skeleton */}
        <Card className="min-h-[350px] flex flex-col justify-between lg:col-span-1">
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-60" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center space-y-6">
            <div className="flex justify-center py-2">
              <div className="h-36 w-36 rounded-full border-8 border-esg-moss/10 flex items-center justify-center">
                <div className="space-y-1 text-center">
                  <Skeleton className="h-2 w-12 mx-auto" />
                  <Skeleton className="h-5 w-16 mx-auto" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads Skeleton */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center border-b border-esg-moss/20 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { facilities, uploads, dashboardSummary, scopeMetrics, facilityComparison, trends, dashboardLoading } = useESGData();

  if (dashboardLoading && !dashboardSummary) {
    return <DashboardSkeleton />;
  }
  const [facilityFilter, setFacilityFilter] = React.useState("All");
  const [hoveredTrendPoint, setHoveredTrendPoint] = React.useState<number | null>(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = React.useState<number | null>(null);

  // Get list of facility names from backend
  const facilityNames = React.useMemo(() => {
    return ["All", ...facilities.map(f => f.name)];
  }, [facilities]);

  // Dashboard Stats Calculations using backend data
  const stats = React.useMemo(() => {
    if (!dashboardSummary) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        anomalies: 0,
        totalEmissions: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        avgProcessingTime: "0.0s"
      };
    }

    const total = dashboardSummary.total_records;
    const pending = dashboardSummary.pending_reviews;
    const approved = dashboardSummary.approved_records;
    const anomalies = dashboardSummary.anomalies;
    const avgProcessingTime = dashboardSummary.avg_processing_time !== undefined
      ? `${dashboardSummary.avg_processing_time.toFixed(2)}s`
      : "0.0s";

    let s1 = scopeMetrics?.scope_1_totals || 0;
    let s2 = scopeMetrics?.scope_2_totals || 0;
    let s3 = scopeMetrics?.scope_3_totals || 0;
    let totalEmissions = s1 + s2 + s3;

    // Apply proportional scaling for facility filter locally if a specific facility is selected
    if (facilityFilter !== "All" && facilityComparison) {
      const facilityEmissions = facilityComparison[facilityFilter] || 0;
      const ratio = totalEmissions > 0 ? facilityEmissions / totalEmissions : 0;
      s1 = s1 * ratio;
      s2 = s2 * ratio;
      s3 = s3 * ratio;
      totalEmissions = facilityEmissions;
    }

    return {
      total,
      pending,
      approved,
      anomalies,
      totalEmissions: Math.round(totalEmissions * 10) / 10,
      scope1: Math.round(s1 * 10) / 10,
      scope2: Math.round(s2 * 10) / 10,
      scope3: Math.round(s3 * 10) / 10,
      avgProcessingTime
    };
  }, [dashboardSummary, scopeMetrics, facilityFilter, facilityComparison]);

  // Calculate percentages for Scope stacked bar
  const scopePercentages = React.useMemo(() => {
    const total = stats.scope1 + stats.scope2 + stats.scope3;
    if (total === 0) return { s1: 0, s2: 0, s3: 0 };
    
    const s1Raw = (stats.scope1 / total) * 100;
    const s2Raw = (stats.scope2 / total) * 100;
    const s3Raw = (stats.scope3 / total) * 100;
    
    const formatPct = (val: number, raw: number) => {
      if (val === 0) return 0;
      if (raw < 0.1) return 0.1;
      return Math.round(raw * 10) / 10;
    };

    return {
      s1: formatPct(stats.scope1, s1Raw),
      s2: formatPct(stats.scope2, s2Raw),
      s3: formatPct(stats.scope3, s3Raw),
    };
  }, [stats]);

  // Process monthly historical points for Ingestion Trend SVG Area Chart from backend trends
  const trendPoints = React.useMemo(() => {
    if (!trends || !trends.monthly_emissions) return [];

    let multiplier = 1;
    if (facilityFilter !== "All" && facilityComparison && scopeMetrics) {
      const overallTotal = (scopeMetrics.scope_1_totals || 0) + (scopeMetrics.scope_2_totals || 0) + (scopeMetrics.scope_3_totals || 0);
      multiplier = overallTotal > 0 ? (facilityComparison[facilityFilter] || 0) / overallTotal : 0;
    }

    return trends.monthly_emissions.map(p => {
      const parts = p.month.split("-");
      let monthLabel = p.month;
      if (parts.length === 2) {
        const monthNum = parseInt(parts[1], 10);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthLabel = months[monthNum - 1] || p.month;
      }
      return {
        month: monthLabel,
        val: Math.round((p.emissions * multiplier) * 10) / 10
      };
    });
  }, [trends, facilityFilter, facilityComparison, scopeMetrics]);

  // SVG Area coordinates generation
  const svgCoordinates = React.useMemo(() => {
    const width = 600;
    const height = 240;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;
    
    const maxVal = Math.max(...trendPoints.map(p => p.val), 10);
    // Round maxVal up to a nice multiple of 10
    const niceMax = Math.ceil(maxVal / 10) * 10;
    const minVal = 0;
    const range = niceMax - minVal;

    const points = trendPoints.map((p, idx) => {
      const x = paddingLeft + (idx * (width - paddingLeft - paddingRight)) / (trendPoints.length - 1);
      const y = height - paddingBottom - ((p.val - minVal) / range) * (height - paddingTop - paddingBottom);
      return { x, y, label: p.month, val: p.val };
    });

    const getBezierPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const dx = (p1.x - p0.x) / 2;
        path += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    const linePath = getBezierPath(points);
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : "";

    // Generate 5 grid lines and labels
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
      const val = minVal + fraction * range;
      const y = height - paddingBottom - fraction * (height - paddingTop - paddingBottom);
      return { val: Math.round(val * 10) / 10, y };
    });

    return { 
      points, 
      linePath, 
      areaPath, 
      yTicks, 
      width, 
      height, 
      paddingLeft, 
      paddingRight, 
      paddingTop, 
      paddingBottom 
    };
  }, [trendPoints]);

  // Hover hit zones for chart points
  const trendHoverRects = React.useMemo(() => {
    const { points, height, width, paddingLeft, paddingRight, paddingTop, paddingBottom } = svgCoordinates;
    if (points.length === 0) return [];
    
    const step = (width - paddingLeft - paddingRight) / (points.length - 1);
    return points.map((p, idx) => {
      const w = idx === 0 || idx === points.length - 1 ? step / 2 : step;
      const x = idx === 0 ? p.x : p.x - step / 2;
      return {
        x,
        w,
        y: paddingTop,
        h: height - paddingTop - paddingBottom,
        index: idx
      };
    });
  }, [svgCoordinates]);  // Segmented donut slices calculation
  const donutSlices = React.useMemo(() => {
    const r = 36;
    const circ = 2 * Math.PI * r; // ~226.19
    
    const { s1, s2, s3 } = scopePercentages;
    
    const activeSegments = [
      { id: 1, pct: s1, val: stats.scope1, color: "#ccd5ae", label: "Scope 1 (Direct)", shortLabel: "Scope 1" },
      { id: 2, pct: s2, val: stats.scope2, color: "#e9edc9", label: "Scope 2 (Electricity)", shortLabel: "Scope 2" },
      { id: 3, pct: s3, val: stats.scope3, color: "#d4a373", label: "Scope 3 (Value Chain)", shortLabel: "Scope 3" }
    ].filter(s => s.pct > 0);
    
    if (activeSegments.length === 0) {
      return [
        {
          dashArray: `${circ}`,
          dashOffset: 0,
          color: "#d3d7be", // esg-border
          label: "No Data",
          shortLabel: "No Data",
          value: 0,
          percentage: 0,
          id: 0
        }
      ];
    }
    
    let currentOffset = 0;
    
    return activeSegments.map((seg) => {
      const actualPct = seg.pct;
      const strokeLength = (actualPct / 100) * circ;
      
      const slice = {
        dashArray: `${strokeLength} ${circ - strokeLength}`,
        dashOffset: currentOffset,
        color: seg.color,
        label: seg.label,
        shortLabel: seg.shortLabel,
        value: seg.val,
        percentage: seg.pct,
        id: seg.id
      };
      
      currentOffset -= strokeLength;
      return slice;
    });
  }, [scopePercentages, stats]);

  // Center text in the donut chart
  const donutCenterText = React.useMemo(() => {
    if (hoveredDonutSlice !== null) {
      const slice = donutSlices.find(s => s.id === hoveredDonutSlice);
      if (slice) {
        return {
          value: `${slice.percentage}%`,
          label: slice.shortLabel,
          subLabel: `${formatShortNumber(slice.value)} tCO2e`
        };
      }
    }
    return {
      value: formatShortNumber(stats.totalEmissions),
      label: "Total tCO2e",
      subLabel: "Verified carbon"
    };
  }, [hoveredDonutSlice, donutSlices, stats.totalEmissions]);
  return (
    <div className="space-y-6">
      {/* Upper Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-esg-dark">ESG Sustainability Dashboard</h2>
          <p className="text-xs text-esg-muted mt-1">
            Real-time calculations of Greenhouse Gas (GHG) inventories and anomaly alerts.
          </p>
        </div>
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <Building className="h-4 w-4 text-esg-muted" />
          <Select 
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-64 bg-esg-clay border border-esg-moss text-xs font-medium h-9"
          >
            {facilityNames.map((fac) => (
              <option key={fac} value={fac}>
                {fac === "All" ? "All Facilities" : fac}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Grid of Key Widgets (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Total Records */}
        <Card className="col-span-1 md:col-span-2 h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-esg-text uppercase tracking-wider block whitespace-nowrap">Total Records</span>
              <span className="text-3xl font-extrabold text-esg-dark block">{stats.total}</span>
              <span className="text-[9.5px] text-esg-text font-semibold flex items-center mt-1 whitespace-nowrap">
                <Database className="h-3.5 w-3.5 mr-1 text-esg-text/80" />
                Ingestion sources
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-esg-sage/35 border border-esg-sage flex items-center justify-center text-esg-text shrink-0 ml-3">
              <Database className="h-6 w-6 text-esg-text" />
            </div>
          </div>
        </Card>

        {/* Pending Reviews */}
        <Link to="/review" className="block col-span-1 md:col-span-2 h-full">
          <Card className="h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer border-esg-sand/40 hover:border-esg-sand/80">
            <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-esg-text uppercase tracking-wider block whitespace-nowrap">Pending Reviews</span>
                <span className="text-3xl font-extrabold text-esg-dark block">{stats.pending}</span>
                <span className="text-[9.5px] text-amber-800 font-bold flex items-center mt-1 whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5 mr-1 text-amber-800" />
                  Awaiting sign-off
                </span>
              </div>
              <div className="h-12 w-12 rounded-full bg-esg-sand/20 border border-esg-sand/40 flex items-center justify-center text-amber-800 shrink-0 ml-3">
                <Clock className="h-6 w-6 text-amber-800" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Approved Records */}
        <Card className="col-span-1 md:col-span-2 h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-esg-text uppercase tracking-wider block whitespace-nowrap">Approved Records</span>
              <span className="text-3xl font-extrabold text-esg-dark block">{stats.approved}</span>
              <span className="text-[9.5px] text-emerald-800 font-bold flex items-center mt-1 whitespace-nowrap">
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-800" />
                Audited & verified
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-esg-sage/40 border border-esg-sage flex items-center justify-center text-emerald-800 shrink-0 ml-3">
              <CheckCircle className="h-6 w-6 text-emerald-800" />
            </div>
          </div>
        </Card>

        {/* Anomalies Detected */}
        <Link to="/review?filter=anomalies" className="block col-span-1 md:col-span-3 h-full">
          <Card className={`h-full hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer ${
            stats.anomalies > 0 
              ? 'border-red-400 bg-red-500/5 hover:border-red-500' 
              : 'hover:border-esg-sand/60'
          }`}>
            <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-esg-text uppercase tracking-wider block whitespace-nowrap">Anomalies</span>
                <span className={`text-3xl font-extrabold block ${stats.anomalies > 0 ? 'text-red-700' : 'text-esg-dark'}`}>
                  {stats.anomalies}
                </span>
                <span className={`text-[9.5px] font-bold flex items-center mt-1 whitespace-nowrap ${
                  stats.anomalies > 0 ? 'text-red-700' : 'text-esg-text'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Flags requiring review
                </span>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ml-3 ${
                stats.anomalies > 0 
                  ? 'bg-red-100 border border-red-200 text-red-700' 
                  : 'bg-esg-moss/40 border border-esg-moss/60 text-esg-text'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Processing Time */}
        <Card className="col-span-1 md:col-span-3 h-full">
          <div className="p-5 flex items-center justify-between h-full min-h-[110px]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-esg-text uppercase tracking-wider block whitespace-nowrap">Processing Time</span>
              <span className="text-3xl font-extrabold text-esg-dark block">{stats.avgProcessingTime}</span>
              <span className="text-[9.5px] text-esg-text font-semibold flex items-center mt-1 whitespace-nowrap">
                <TrendingUp className="h-3.5 w-3.5 mr-1 text-esg-text/80" />
                Avg parse + pipeline
              </span>
            </div>
            <div className="h-12 w-12 rounded-full bg-esg-moss/50 border border-esg-moss flex items-center justify-center text-esg-text shrink-0 ml-3">
              <TrendingUp className="h-6 w-6 text-esg-text" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Ingestion Trend Area Chart (SVG) */}
        <Card className="flex flex-col justify-between relative overflow-visible lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-3 sm:gap-0">
              <div>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-esg-muted" />
                  Emissions Ingestion Trend
                </CardTitle>
                <CardDescription>
                  Total calculated carbon inventory (tCO2e) over recent months.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-esg-ivory border-esg-border text-esg-text">
                Monthly Aggregates
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[260px] relative overflow-visible">
            <div className="w-full h-56 relative mt-2 overflow-visible">
              <svg 
                viewBox={`0 0 ${svgCoordinates.width} ${svgCoordinates.height}`} 
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Custom color gradients matching the palette */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ccd5ae" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#ccd5ae" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines & Y-ticks */}
                {svgCoordinates.yTicks.map((tick, idx) => (
                  <g key={idx}>
                    {idx > 0 && (
                      <line 
                        x1={svgCoordinates.paddingLeft} 
                        y1={tick.y} 
                        x2={svgCoordinates.width - svgCoordinates.paddingRight} 
                        y2={tick.y} 
                        stroke="#d3d7be" 
                        strokeOpacity="0.3" 
                        strokeDasharray="3 3" 
                      />
                    )}
                    <text
                      x={svgCoordinates.paddingLeft - 8}
                      y={tick.y + 3}
                      textAnchor="end"
                      className="text-[9px] font-semibold fill-esg-muted/80 font-mono"
                    >
                      {formatShortNumber(tick.val)}
                    </text>
                  </g>
                ))}

                {/* Axis lines */}
                <line 
                  x1={svgCoordinates.paddingLeft} 
                  y1={svgCoordinates.height - svgCoordinates.paddingBottom} 
                  x2={svgCoordinates.width - svgCoordinates.paddingRight} 
                  y2={svgCoordinates.height - svgCoordinates.paddingBottom} 
                  stroke="#d3d7be" 
                  strokeWidth="1" 
                />
                <line 
                  x1={svgCoordinates.paddingLeft} 
                  y1={svgCoordinates.paddingTop} 
                  x2={svgCoordinates.paddingLeft} 
                  y2={svgCoordinates.height - svgCoordinates.paddingBottom} 
                  stroke="#d3d7be" 
                  strokeWidth="1" 
                />

                {/* Area under the line */}
                {svgCoordinates.areaPath && (
                  <path d={svgCoordinates.areaPath} fill="url(#areaGrad)" />
                )}
                
                {/* Trend line */}
                {svgCoordinates.linePath && (
                  <path 
                    d={svgCoordinates.linePath} 
                    fill="none" 
                    stroke="#ccd5ae" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Vertical hover guide line */}
                {hoveredTrendPoint !== null && (
                  <line 
                    x1={svgCoordinates.points[hoveredTrendPoint].x} 
                    y1={svgCoordinates.paddingTop} 
                    x2={svgCoordinates.points[hoveredTrendPoint].x} 
                    y2={svgCoordinates.height - svgCoordinates.paddingBottom} 
                    stroke="#d4a373" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                    className="pointer-events-none"
                  />
                )}

                {/* Coordinate marker dots */}
                {svgCoordinates.points.map((p, idx) => (
                  <g key={idx}>
                    {/* Ring highlight halo when hovered */}
                    {hoveredTrendPoint === idx && (
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="8" 
                        className="fill-esg-sand/30 stroke-esg-sand/50 stroke-[1.5px] pointer-events-none"
                      />
                    )}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={hoveredTrendPoint === idx ? 5.5 : 4} 
                      className="transition-colors duration-150 cursor-pointer fill-esg-clay stroke-esg-sage stroke-[2px] hover:fill-esg-sand hover:stroke-white"
                    />
                  </g>
                ))}

                {/* X Labels */}
                {svgCoordinates.points.map((p, idx) => (
                  <text 
                    key={idx}
                    x={p.x} 
                    y={svgCoordinates.height - 10} 
                    textAnchor="middle" 
                    className={`text-[9px] font-semibold transition-colors duration-150 ${
                      hoveredTrendPoint === idx ? 'fill-esg-sand font-bold' : 'fill-esg-muted'
                    }`}
                  >
                    {p.label}
                  </text>
                ))}

                {/* Transparent hit zones for easy hover */}
                {trendHoverRects.map((r) => (
                  <rect
                    key={r.index}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredTrendPoint(r.index)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                ))}

                {/* Floating Tooltip inside SVG */}
                {hoveredTrendPoint !== null && (
                  <g className="pointer-events-none">
                    {/* Tooltip Background Card */}
                    <rect
                      x={svgCoordinates.points[hoveredTrendPoint].x - 55}
                      y={svgCoordinates.points[hoveredTrendPoint].y - 50}
                      width="110"
                      height="40"
                      rx="6"
                      fill="#1c2514" // esg-dark equivalent
                      stroke="#d3d7be" // esg-border equivalent
                      strokeWidth="1"
                      strokeOpacity="0.2"
                    />
                    
                    {/* Month Ingestion Text */}
                    <text
                      x={svgCoordinates.points[hoveredTrendPoint].x}
                      y={svgCoordinates.points[hoveredTrendPoint].y - 38}
                      textAnchor="middle"
                      className="text-[8.5px] font-bold fill-esg-sage font-sans"
                    >
                      {svgCoordinates.points[hoveredTrendPoint].label} Ingestion
                    </text>
                    
                    {/* Value text with units */}
                    <text
                      x={svgCoordinates.points[hoveredTrendPoint].x}
                      y={svgCoordinates.points[hoveredTrendPoint].y - 22}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-white font-mono"
                    >
                      {formatShortNumber(svgCoordinates.points[hoveredTrendPoint].val)}
                      <tspan className="text-[8px] font-sans fill-esg-moss font-semibold"> tCO2e</tspan>
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Scope 1 / 2 / 3 Emissions Distribution (Donut Chart) */}
        <Card className="flex flex-col justify-between lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-esg-muted" />
                  Scope Distribution
                </CardTitle>
                <CardDescription>
                  Share of audited emissions by scope (GHG Protocol).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Interactive SVG Donut Chart in Center */}
            <div className="relative flex items-center justify-center py-2 h-48">
              <svg 
                viewBox="0 0 100 100" 
                className="w-44 h-44 drop-shadow-sm overflow-visible -rotate-90"
              >
                {/* Background Ring */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="36" 
                  fill="transparent" 
                  stroke="rgba(47, 59, 37, 0.08)" // theme-cohesive semi-transparent tone
                  strokeWidth={8} 
                />

                {/* Slices */}
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={hoveredDonutSlice === slice.id ? 10 : 8}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    strokeLinecap="butt" // flat ends with clean gaps
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredDonutSlice(slice.id)}
                    onMouseLeave={() => setHoveredDonutSlice(null)}
                  />
                ))}
              </svg>

              {/* Center HTML text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-bold text-esg-muted uppercase tracking-wider text-center max-w-[110px] truncate">
                  {donutCenterText.label}
                </span>
                <span className="text-2xl font-black text-esg-dark font-sans tracking-tight leading-none my-1">
                  {donutCenterText.value}
                </span>
                <span className="text-[9px] font-semibold text-esg-muted/80">
                  {donutCenterText.subLabel}
                </span>
              </div>
            </div>

            {/* Scope Details List */}
            <div className="space-y-2 pt-2">
              {/* Scope 1 */}
              <div 
                className={`flex items-center justify-between text-xs border-b border-esg-moss/30 pb-2 transition-all duration-200 px-2 py-1.5 rounded cursor-pointer ${
                  hoveredDonutSlice === 1 ? "bg-esg-sage/25 scale-[1.01]" : "hover:bg-esg-sage/5"
                }`}
                onMouseEnter={() => setHoveredDonutSlice(1)}
                onMouseLeave={() => setHoveredDonutSlice(null)}
              >
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-esg-sage block shadow-sm border border-esg-border" />
                  <span className="font-semibold text-esg-dark">Scope 1 (Direct)</span>
                </div>
                <span className="font-bold text-esg-text">
                  {formatShortNumber(stats.scope1)} tCO2e ({scopePercentages.s1}%)
                </span>
              </div>

              {/* Scope 2 */}
              <div 
                className={`flex items-center justify-between text-xs border-b border-esg-moss/30 pb-2 transition-all duration-200 px-2 py-1.5 rounded cursor-pointer ${
                  hoveredDonutSlice === 2 ? "bg-esg-moss/50 scale-[1.01]" : "hover:bg-esg-moss/10"
                }`}
                onMouseEnter={() => setHoveredDonutSlice(2)}
                onMouseLeave={() => setHoveredDonutSlice(null)}
              >
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-esg-moss block border border-esg-border shadow-sm" />
                  <span className="font-semibold text-esg-dark">Scope 2 (Electricity)</span>
                </div>
                <span className="font-bold text-esg-text">
                  {formatShortNumber(stats.scope2)} tCO2e ({scopePercentages.s2}%)
                </span>
              </div>

              {/* Scope 3 */}
              <div 
                className={`flex items-center justify-between text-xs transition-all duration-200 px-2 py-1.5 rounded cursor-pointer ${
                  hoveredDonutSlice === 3 ? "bg-esg-sand/25 scale-[1.01]" : "hover:bg-esg-sand/5"
                }`}
                onMouseEnter={() => setHoveredDonutSlice(3)}
                onMouseLeave={() => setHoveredDonutSlice(null)}
              >
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-esg-sand block shadow-sm border border-esg-border" />
                  <span className="font-semibold text-esg-dark">Scope 3 (Value Chain)</span>
                </div>
                <span className="font-bold text-esg-text">
                  {formatShortNumber(stats.scope3)} tCO2e ({scopePercentages.s3}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-3 sm:gap-0">
          <div>
            <CardTitle>Recent File Ingestions</CardTitle>
            <CardDescription>
              Check the status of automated parsing and validation errors.
            </CardDescription>
          </div>
          <Link to="/history">
            <Button variant="outline" size="sm" className="space-x-1 text-xs">
              <span>View History</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left divide-y divide-esg-moss/40">
              <thead className="bg-esg-moss/30 text-esg-dark text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">File Name</th>
                  <th className="p-4">Source Type</th>
                  <th className="p-4">Date Ingested</th>
                  <th className="p-4">Records Count</th>
                  <th className="p-4 pr-6 text-right">Ingestion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-esg-moss/30 bg-esg-clay/10">
                {uploads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-4">
                        <div className="h-10 w-10 rounded-full bg-esg-moss/30 flex items-center justify-center text-esg-muted shadow-sm">
                          <Database className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-esg-dark">No recent file ingestions</p>
                          <p className="text-xs text-esg-muted max-w-xs mx-auto leading-relaxed">
                            Ingested files will appear here. Get started by uploading your first ESG reporting sheet.
                          </p>
                        </div>
                        <Link to="/upload" className="pt-2">
                          <Button size="sm" className="bg-esg-sage hover:bg-esg-sage/85 text-esg-dark font-bold text-xs h-8 px-4 rounded-lg shadow-sm border border-esg-border/30">
                            Upload Now
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  uploads.slice(0, 3).map((item) => (
                    <tr key={item.id} className="hover:bg-esg-moss/10 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-esg-dark max-w-[240px] truncate">
                        {item.file_name}
                      </td>
                      <td className="p-4 capitalize text-xs">
                        {item.source_type.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-xs text-esg-muted">
                        {new Date(item.upload_date).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="p-4 font-mono text-xs">{item.processing_summary?.row_count || 0} rows</td>
                      <td className="p-4 pr-6 text-right">
                        <Badge 
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
