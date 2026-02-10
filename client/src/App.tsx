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
import CompleteDelivery from "@/pages/driver/CompleteDelivery";
import DriverDeliveries from "@/pages/driver/DriverDeliveries";
import DriverHistory from "@/pages/driver/DriverHistory";
import DriverQueue from "@/pages/driver/DriverQueue";
import DriverSettings from "@/pages/driver/DriverSettings";
import NotificationCenter from "@/pages/driver/NotificationCenter";
import ManagerLogin from "@/pages/manager/ManagerLogin";
import ManagerDashboard from "@/pages/manager/AdvancedDashboard";
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
import FleetDocuments from "@/pages/manager/FleetDocuments";
import VehicleDetails from "@/pages/manager/VehicleDetails";
import UserRoles from "@/pages/manager/UserRoles";
import NotificationPreferences from "@/pages/manager/NotificationPreferences";
import NotificationHistory from './pages/manager/NotificationHistory';
import PayRates from './pages/manager/PayRates';
import FuelIntelligence from './pages/manager/FuelIntelligence';
import Drivers from './pages/manager/Drivers';
import Referrals from './pages/manager/Referrals';
import Deliveries from './pages/manager/Deliveries';
import Performance from "@/pages/admin/Performance";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCompanies from "@/pages/admin/Companies";
import DCEuropeanDemo from "@/pages/demo/DCEuropeanDemo";
import TruckerTimDemo from "@/pages/demo/TruckerTimDemo";
import TitanFleetDemo from "@/pages/demo/TitanFleetDemo";
import ProcurementFAQ from "@/pages/ProcurementFAQ";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";
import RefundPolicy from "@/pages/RefundPolicy";
import SetupAccount from "@/pages/SetupAccount";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import HelpCenter from "@/pages/HelpCenter";
import NotFound from "@/pages/not-found";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeedbackButton } from "@/components/FeedbackButton";

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
      <Route path="/driver/complete-delivery" component={CompleteDelivery} />
      <Route path="/driver/deliveries" component={DriverDeliveries} />
      <Route path="/driver/history" component={DriverHistory} />
      <Route path="/driver/queue" component={DriverQueue} />
      <Route path="/driver/settings" component={DriverSettings} />
      <Route path="/driver/notifications" component={NotificationCenter} />
      <Route path="/manager/login" component={ManagerLogin} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/inspections" component={ManagerInspections} />
      <Route path="/manager/defects" component={ManagerDefects} />
      <Route path="/manager/fuel" component={ManagerFuelLog} />
      <Route path="/manager/fleet" component={ManagerFleet} />
      <Route path="/manager/vehicle/:id" component={VehicleDetails} />
      <Route path="/manager/documents" component={ManagerDocuments} />
      <Route path="/manager/license" component={ManagerLicense} />
      <Route path="/manager/audit-log" component={ManagerAuditLog} />
      <Route path="/manager/settings" component={ManagerSettings} />
      <Route path="/manager/live-tracking" component={LiveTracking} />
      <Route path="/manager/drivers" component={Drivers} />
      <Route path="/manager/timesheets" component={Timesheets} />
      <Route path="/manager/pay-rates" component={PayRates} />
      <Route path="/manager/fuel-intelligence" component={FuelIntelligence} />
      <Route path="/manager/titan-command" component={TitanCommand} />
      <Route path="/manager/geofences" component={Geofences} />
      <Route path="/manager/fleet-documents" component={FleetDocuments} />
      <Route path="/manager/user-roles" component={UserRoles} />
      <Route path="/manager/notifications" component={NotificationPreferences} />
      <Route path="/manager/notification-history" component={NotificationHistory} />
      <Route path="/manager/referrals" component={Referrals} />
      <Route path="/manager/deliveries" component={Deliveries} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/companies" component={AdminCompanies} />
      <Route path="/admin/performance" component={Performance} />
      <Route path="/demo/dc-european" component={DCEuropeanDemo} />
      <Route path="/demo/trucker-tim" component={TruckerTimDemo} />
      <Route path="/demo" component={TitanFleetDemo} />
      <Route path="/procurement-faq" component={ProcurementFAQ} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/setup-account" component={SetupAccount} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/help" component={HelpCenter} />
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
          <FeedbackButton />
        </BrandProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
