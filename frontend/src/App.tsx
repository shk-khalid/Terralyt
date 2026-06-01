import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Login } from "@/pages/Login";
import { RegisterTenant } from "@/pages/RegisterTenant";
import { Dashboard } from "@/pages/Dashboard";
import { ReviewQueue } from "@/pages/ReviewQueue";
import { UploadCenter } from "@/pages/UploadCenter";
import { UploadHistory } from "@/pages/UploadHistory";
import { AuditLogs } from "@/pages/AuditLogs";
import { Settings } from "@/pages/Settings";
import { RecordDetail } from "@/pages/RecordDetail";
import { Facilities } from "@/pages/Facilities";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { ESGDataProvider } from "@/context/ESGDataContext";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ESGDataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Gate */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterTenant />} />
              
              {/* Authenticated Dashboard Core Layout protected by ProtectedRoute */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="facilities" element={<Facilities />} />
                <Route path="review" element={<ReviewQueue />} />
                <Route path="upload" element={<UploadCenter />} />
                <Route path="history" element={<UploadHistory />} />
                <Route path="logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="record/:id" element={<RecordDetail />} />
              </Route>

              {/* Catch-all redirect to index dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ESGDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
