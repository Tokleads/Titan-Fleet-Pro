# Fleet Inspection App - TODO

## VOR (Vehicle Off Road) Management

- [x] Update database schema with VOR fields
- [x] Create backend API procedures for VOR management
- [x] Build VOR status toggle UI component
- [x] Add VOR reason dropdown with predefined reasons
- [ ] Create VOR history tracking
- [x] Add VOR dashboard widget showing off-road vehicles
- [x] Add VOR indicators to vehicle list
- [ ] Add VOR filter to vehicle list
- [ ] Create VOR report page
- [x] Test VOR workflow end-to-end

## Service Interval System

- [x] Update database schema with service interval fields
- [x] Create service schedule configuration table
- [x] Create backend API for service interval management
- [x] Build service interval configuration UI
- [x] Add service due calculation logic
- [x] Create service history tracking
- [x] Add service due dashboard widget
- [x] Add service due alerts to vehicle list
- [ ] Create service reminder notifications
- [x] Test service interval workflow end-to-end

## Countdown Timers Feature

- [x] Create countdown calculation utility functions
- [x] Build CountdownBadge component for vehicle cards
- [x] Add MOT countdown to vehicle cards
- [x] Add Tax countdown to vehicle cards
- [x] Add Service countdown to vehicle cards
- [x] Create MOT countdown dashboard widget
- [x] Create Tax countdown dashboard widget
- [x] Create Service countdown dashboard widget
- [x] Add color-coded urgency indicators (green/amber/red)
- [x] Test countdown calculations and display

## Report System

- [x] Create report generation backend infrastructure
- [x] Build Vehicle List Report
- [x] Build Driver List Report
- [x] Build Fuel Purchase Report
- [x] Build Defect Report
- [x] Build Service Due Report
- [x] Build MOT Expiry Report
- [x] Build VOR Analysis Report
- [x] Build Safety Inspection Report
- [x] Build Mileage Report
- [x] Build Cost Analysis Report
- [x] Create report UI components
- [x] Build Reports page with report list
- [x] Implement CSV export functionality
- [x] Implement PDF export functionality
- [x] Add report filtering and date ranges
- [x] Test all reports end-to-end

## DVLA License Integration

- [x] Update database schema with license verification tables
- [x] Create DVLA service infrastructure
- [x] Build DVLA API authentication service
- [x] Implement license checking functionality
- [x] Create license verification API endpoints
- [x] Build license verification UI
- [x] Add license history tracking
- [x] Create license expiry alerts
- [x] Add license status dashboard widget
- [x] Build penalty points tracking
- [x] Add disqualification alerts
- [x] Test DVLA integration end-to-end

## Fleet Hierarchy System

- [x] Update database schema with hierarchy tables (categories, cost centres, departments)
- [x] Add hierarchy fields to vehicles table
- [x] Create backend API for hierarchy management
- [x] Build category management UI
- [x] Build cost centre management UI
- [x] Build department management UI
- [x] Add hierarchy assignment to vehicle creation/edit
- [x] Add hierarchy filtering to fleet page
- [x] Add hierarchy filtering to reports
- [x] Add hierarchy grouping views
- [x] Test fleet hierarchy end-to-end

## CI/CD Test Failures (GitHub Actions)

- [x] Fix TypeScript error: Property 'costPerLiter' does not exist on fuelEntries (should be 'costPerLitre')
- [x] Fix TypeScript error: Property 'liters' does not exist on fuelEntries (should be 'litres')
- [x] Fix TypeScript error: Properties 'licenseExpiry', 'licenseNumber', 'phone' do not exist on drivers table
- [x] Fix TypeScript error: Property 'type' does not exist on vehicles table
- [x] Fix TypeScript error: Property 'where' does not exist in reports.ts
- [x] Fix TypeScript error: Property 'get' does not exist on storage in Reports.tsx
- [x] Fix TypeScript error: Module 'wouter' has no exported member 'useNavigate' in LicenseAlertsWidget.tsx

## User Roles & Permissions System

- [x] Update database schema with role-based permissions
- [x] Create permission checking middleware
- [ ] Build role management API endpoints
- [ ] Add admin-only routes protection
- [x] Build role assignment UI for admins
- [x] Add permission checks to frontend components
- [x] Create role-based navigation menus
- [ ] Test role-based access control end-to-end

## Notification System

- [x] Update database schema with notification preferences
- [x] Create notification service infrastructure
- [x] Build email notification templates
- [x] Implement MOT expiry notifications
- [x] Implement Tax expiry notifications
- [x] Implement Service due notifications
- [x] Implement DVLA license expiry notifications
- [x] Implement VOR status notifications
- [x] Build notification preferences UI
- [x] Add notification history page
- [ ] Test notification delivery end-to-end

## Document Management System

- [x] Update database schema with document tables
- [ ] Create document upload API endpoints
- [ ] Build document storage integration (S3/Drive)
- [x] Implement vehicle document upload
- [x] Implement driver document upload
- [x] Add document expiry tracking
- [x] Build document list UI
- [x] Add document download functionality
- [x] Create document expiry alerts
- [x] Add document categories (Insurance, V5C, License, CPC, etc.)
- [ ] Test document management end-to-end

## Advanced Dashboard

- [x] Create enhanced KPI cards with trends
- [x] Build fleet overview chart (vehicles by status)
- [x] Add cost analysis chart (fuel vs service costs)
- [x] Create compliance status chart (MOT, Tax, Service)
- [x] Build driver activity chart
- [x] Add defect trend analysis
- [x] Create quick action buttons
- [x] Add recent activity feed
- [x] Implement dashboard filters (date range, vehicle category)
- [ ] Test advanced dashboard end-to-end

## Backend API Implementation

### Fleet Documents APIs
- [x] Create documents table schema in database
- [x] Build POST /api/documents/upload endpoint with S3 integration
- [x] Build GET /api/documents endpoint with filters
- [x] Build GET /api/documents/:id endpoint
- [x] Build PUT /api/documents/:id endpoint
- [x] Build DELETE /api/documents/:id endpoint
- [x] Build GET /api/documents/stats endpoint
- [x] Build GET /api/documents/:id/download endpoint
- [x] Connect FleetDocuments UI to real API
- [ ] Test document upload and retrieval end-to-end

### Advanced Dashboard APIs
- [x] Build GET /api/dashboard/kpis endpoint
- [x] Build GET /api/dashboard/fleet-overview endpoint
- [x] Build GET /api/dashboard/cost-analysis endpoint
- [x] Build GET /api/dashboard/compliance endpoint
- [x] Build GET /api/dashboard/driver-activity endpoint
- [x] Build GET /api/dashboard/defect-trends endpoint
- [x] Build GET /api/dashboard/recent-activity endpoint
- [x] Connect AdvancedDashboard UI to real API
- [ ] Test dashboard with real data

### Notification System APIs
- [x] Build GET /api/notifications/preferences endpoint
- [x] Build PUT /api/notifications/preferences endpoint
- [x] Build POST /api/notifications/test endpoint
- [x] Build GET /api/notifications/history endpoint
- [x] Build DELETE /api/notifications/history/:id endpoint
- [x] Connect NotificationPreferences UI to real API
- [x] Connect NotificationHistory UI to real API
- [ ] Test notification delivery end-to-end

### User Roles APIs
- [x] Build GET /api/users endpoint with filters
- [x] Build PUT /api/users/:id/role endpoint
- [x] Build PUT /api/users/:id/status endpoint
- [x] Build GET /api/roles endpoint
- [x] Build GET /api/roles/:role/permissions endpoint
- [x] Connect UserRoles UI to real API
- [ ] Test role assignment and permissions
