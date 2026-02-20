import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BrandProvider } from "@/hooks/use-brand";
import NotFound from "@/pages/not-found";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeedbackButton } from "@/components/FeedbackButton";

const Landing = lazy(() => import("@/pages/Landing"));
const TitanFleetLandingPage = lazy(() => import("@/pages/TitanFleetLanding"));
const DriverDashboard = lazy(() => import("@/pages/driver/DriverDashboard"));
const VehicleDetail = lazy(() => import("@/pages/driver/VehicleDetail"));
const VehicleInspection = lazy(() => import("@/pages/driver/VehicleInspection"));
const FuelEntry = lazy(() => import("@/pages/driver/FuelEntry"));
const DefectReport = lazy(() => import("@/pages/driver/DefectReport"));
const CompleteDelivery = lazy(() => import("@/pages/driver/CompleteDelivery"));
const DriverDeliveries = lazy(() => import("@/pages/driver/DriverDeliveries"));
const DriverHistory = lazy(() => import("@/pages/driver/DriverHistory"));
const DriverQueue = lazy(() => import("@/pages/driver/DriverQueue"));
const DriverSettings = lazy(() => import("@/pages/driver/DriverSettings"));
const NotificationCenter = lazy(() => import("@/pages/driver/NotificationCenter"));
const EndOfShiftCheck = lazy(() => import("@/pages/driver/EndOfShiftCheck"));
const CarRegister = lazy(() => import("@/pages/driver/CarRegister"));
const ManagerLogin = lazy(() => import("@/pages/manager/ManagerLogin"));
const ManagerDashboardOps = lazy(() => import("@/pages/manager/Dashboard"));
const AdvancedDashboard = lazy(() => import("@/pages/manager/AdvancedDashboard"));
const ManagerInspections = lazy(() => import("@/pages/manager/Inspections"));
const ManagerDefects = lazy(() => import("@/pages/manager/Defects"));
const ManagerFuelLog = lazy(() => import("@/pages/manager/FuelLog"));
const ManagerFleet = lazy(() => import("@/pages/manager/Fleet"));
const ManagerSettings = lazy(() => import("@/pages/manager/Settings"));
const ManagerDocuments = lazy(() => import("@/pages/manager/Documents"));
const ManagerLicense = lazy(() => import("@/pages/manager/License"));
const ManagerAuditLog = lazy(() => import("@/pages/manager/AuditLog"));
const LiveTracking = lazy(() => import("@/pages/manager/LiveTracking"));
const Timesheets = lazy(() => import("@/pages/manager/Timesheets"));
const TitanCommand = lazy(() => import("@/pages/manager/TitanCommand"));
const Geofences = lazy(() => import("@/pages/manager/Geofences"));
const FleetDocuments = lazy(() => import("@/pages/manager/FleetDocuments"));
const VehicleDetails = lazy(() => import("@/pages/manager/VehicleDetails"));
const UserRoles = lazy(() => import("@/pages/manager/UserRoles"));
const NotificationPreferences = lazy(() => import("@/pages/manager/NotificationPreferences"));
const NotificationHistory = lazy(() => import("@/pages/manager/NotificationHistory"));
const PayRates = lazy(() => import("@/pages/manager/PayRates"));
const FuelIntelligence = lazy(() => import("@/pages/manager/FuelIntelligence"));
const Drivers = lazy(() => import("@/pages/manager/Drivers"));
const Referrals = lazy(() => import("@/pages/manager/Referrals"));
const Deliveries = lazy(() => import("@/pages/manager/Deliveries"));
const VehicleManagement = lazy(() => import("@/pages/manager/VehicleManagement"));
const OperatorLicence = lazy(() => import("@/pages/manager/OperatorLicence"));
const AIInsights = lazy(() => import("@/pages/manager/AIInsights"));
const ApiHealth = lazy(() => import("@/pages/manager/ApiHealth"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminCompanies = lazy(() => import("@/pages/admin/Companies"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const AdminSignups = lazy(() => import("@/pages/admin/Signups"));
const AdminReferrals = lazy(() => import("@/pages/admin/AdminReferrals"));
const DCEuropeanDemo = lazy(() => import("@/pages/demo/DCEuropeanDemo"));
const TruckerTimDemo = lazy(() => import("@/pages/demo/TruckerTimDemo"));
const TitanFleetDemo = lazy(() => import("@/pages/demo/TitanFleetDemo"));
const ProcurementFAQ = lazy(() => import("@/pages/ProcurementFAQ"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("@/pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const SetupAccount = lazy(() => import("@/pages/SetupAccount"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const Blog = lazy(() => import("@/pages/Blog"));

function LoadingFallback() {
  return (
    <div data-testid="loading-fallback" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
        <Route path="/driver/end-of-shift/:vehicleId" component={EndOfShiftCheck} />
        <Route path="/driver/car-register" component={CarRegister} />
        <Route path="/manager/login" component={ManagerLogin} />
        <Route path="/manager" component={ManagerDashboardOps} />
        <Route path="/manager/advanced-dashboard" component={AdvancedDashboard} />
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
        <Route path="/manager/operator-licence" component={OperatorLicence} />
        <Route path="/manager/vehicle-management" component={VehicleManagement} />
        <Route path="/manager/ai-insights" component={AIInsights} />
        <Route path="/manager/api-health" component={ApiHealth} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/companies" component={AdminCompanies} />
        <Route path="/admin/subscriptions" component={AdminSubscriptions} />
        <Route path="/admin/signups" component={AdminSignups} />
        <Route path="/admin/referrals" component={AdminReferrals} />
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
        <Route path="/blog/:slug" component={Blog} />
        <Route path="/blog" component={Blog} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
