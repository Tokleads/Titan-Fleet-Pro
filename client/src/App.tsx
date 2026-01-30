import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BrandProvider } from "@/hooks/use-brand";
import Landing from "@/pages/Landing";
import TitanFleetLandingPage from "@/pages/TitanFleetLanding";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import VehicleDetail from "@/pages/driver/VehicleDetail";
import VehicleInspection from "@/pages/driver/VehicleInspection";
import FuelEntry from "@/pages/driver/FuelEntry";
import DefectReport from "@/pages/driver/DefectReport";
import ManagerLogin from "@/pages/manager/ManagerLogin";
import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerInspections from "@/pages/manager/Inspections";
import ManagerDefects from "@/pages/manager/Defects";
import ManagerFuelLog from "@/pages/manager/FuelLog";
import ManagerFleet from "@/pages/manager/Fleet";
import ManagerSettings from "@/pages/manager/Settings";
import ManagerDocuments from "@/pages/manager/Documents";
import ManagerLicense from "@/pages/manager/License";
import ManagerAuditLog from "@/pages/manager/AuditLog";
import LiveTracking from "@/pages/manager/LiveTracking";
import Timesheets from "@/pages/manager/Timesheets";
import TitanCommand from "@/pages/manager/TitanCommand";
import Geofences from "@/pages/manager/Geofences";
import AdvancedDashboard from "@/pages/manager/AdvancedDashboard";
import FleetDocuments from "@/pages/manager/FleetDocuments";
import UserRoles from "@/pages/manager/UserRoles";
import NotificationPreferences from "@/pages/manager/NotificationPreferences";
import NotificationHistory from './pages/manager/NotificationHistory';
import PayRates from './pages/manager/PayRates';
import Performance from "@/pages/admin/Performance";
import DCEuropeanDemo from "@/pages/demo/DCEuropeanDemo";
import TruckerTimDemo from "@/pages/demo/TruckerTimDemo";
import TitanFleetDemo from "@/pages/demo/TitanFleetDemo";
import ProcurementFAQ from "@/pages/ProcurementFAQ";
import NotFound from "@/pages/not-found";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TitanFleetLandingPage} />
      <Route path="/app" component={Landing} />
      <Route path="/driver" component={DriverDashboard} />
      <Route path="/driver/vehicle/:id" component={VehicleDetail} />
      <Route path="/driver/inspection/:id" component={VehicleInspection} />
      <Route path="/driver/fuel/:id" component={FuelEntry} />
      <Route path="/driver/defect/:id" component={DefectReport} />
      <Route path="/manager/login" component={ManagerLogin} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/inspections" component={ManagerInspections} />
      <Route path="/manager/defects" component={ManagerDefects} />
      <Route path="/manager/fuel" component={ManagerFuelLog} />
      <Route path="/manager/fleet" component={ManagerFleet} />
      <Route path="/manager/documents" component={ManagerDocuments} />
      <Route path="/manager/license" component={ManagerLicense} />
      <Route path="/manager/audit-log" component={ManagerAuditLog} />
      <Route path="/manager/settings" component={ManagerSettings} />
      <Route path="/manager/live-tracking" component={LiveTracking} />
      <Route path="/manager/timesheets" component={Timesheets} />
      <Route path="/manager/pay-rates" component={PayRates} />
      <Route path="/manager/titan-command" component={TitanCommand} />
      <Route path="/manager/geofences" component={Geofences} />
      <Route path="/manager/advanced-dashboard" component={AdvancedDashboard} />
      <Route path="/manager/fleet-documents" component={FleetDocuments} />
      <Route path="/manager/user-roles" component={UserRoles} />
      <Route path="/manager/notifications" component={NotificationPreferences} />
      <Route path="/manager/notification-history" component={NotificationHistory} />
      <Route path="/admin/performance" component={Performance} />
      <Route path="/demo/dc-european" component={DCEuropeanDemo} />
      <Route path="/demo/trucker-tim" component={TruckerTimDemo} />
      <Route path="/demo" component={TitanFleetDemo} />
      <Route path="/procurement-faq" component={ProcurementFAQ} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrandProvider>
          <Router />
          <Toaster />
          <PWAInstallPrompt />
        </BrandProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
