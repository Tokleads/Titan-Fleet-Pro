CREATE TABLE "account_setup_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(64) NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"tier" varchar(20),
	"max_vehicles" integer,
	"referral_code" varchar(20),
	"used" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_setup_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "api_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_time" integer NOT NULL,
	"error_message" text,
	"error_details" jsonb,
	"checked_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_health_fixes" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_id" integer NOT NULL,
	"api_type" varchar(50) NOT NULL,
	"diagnosis" text NOT NULL,
	"fix_description" text NOT NULL,
	"fix_code" text NOT NULL,
	"fix_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending_approval' NOT NULL,
	"tested_at" timestamp,
	"test_result" jsonb,
	"approved_by" integer,
	"approved_at" timestamp,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_health_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"severity" varchar(20) NOT NULL,
	"error_message" text NOT NULL,
	"error_details" jsonb,
	"failure_count" integer DEFAULT 1,
	"detected_at" timestamp NOT NULL,
	"last_failed_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"action" varchar(50) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" integer,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"previous_hash" varchar(64),
	"current_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"date" timestamp NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer,
	"collision_date" timestamp NOT NULL,
	"status" varchar(30) DEFAULT 'AT_SCENE' NOT NULL,
	"fault" varchar(30),
	"description" text,
	"internal_reference" varchar(100),
	"insurer_reference" varchar(100),
	"accident_services_reference" varchar(100),
	"insurer" varchar(100),
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"primary_color" varchar(7) DEFAULT '#2563eb',
	"secondary_color" varchar(7) DEFAULT '#1e293b',
	"neutral_tint" varchar(7) DEFAULT '#f8fafc',
	"license_tier" varchar(20) DEFAULT 'core' NOT NULL,
	"vehicle_allowance" integer DEFAULT 15 NOT NULL,
	"grace_overage" integer DEFAULT 3 NOT NULL,
	"enforcement_mode" varchar(20) DEFAULT 'soft_block' NOT NULL,
	"settings" jsonb DEFAULT '{"poolFleet":true,"showFuelPrices":false,"requireFuelCardPhoto":true,"enableEndOfShiftCheck":false,"fuelEnabled":true,"adblueEnabled":true,"collisionsEnabled":true,"podEnabled":true,"driverHistoryDays":7,"fuelAnomalyThreshold":2}'::jsonb NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"contact_email" text,
	"is_active" boolean DEFAULT true,
	"google_drive_connected" boolean DEFAULT false,
	"drive_root_folder_id" text,
	"drive_client_id" text,
	"drive_client_secret" text,
	"drive_refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_company_code_unique" UNIQUE("company_code")
);
--> statement-breakpoint
CREATE TABLE "company_car_register" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"number_plate" varchar(20) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_check_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"check_items" jsonb DEFAULT '[{"id":"cab_cleanliness","label":"Cab Cleanliness","required":true,"requiresPhoto":true,"type":"pass_fail"},{"id":"number_plate","label":"Number Plate in Door Pocket","required":true,"requiresPhoto":true,"type":"pass_fail"},{"id":"mileage","label":"Mileage Reading","required":true,"requiresPhoto":true,"type":"numeric"},{"id":"fuel_level","label":"Fuel Level","required":true,"requiresPhoto":true,"type":"percentage","minValue":25},{"id":"adblue_level","label":"AdBlue Level","required":true,"requiresPhoto":true,"type":"percentage","minValue":25},{"id":"fuel_card","label":"Fuel Card Present","required":true,"requiresPhoto":true,"type":"pass_fail"}]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_knowledge" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_title" text NOT NULL,
	"compliance_reference" text NOT NULL,
	"content" text NOT NULL,
	"keywords" text[],
	"category" varchar(100),
	"source_file" varchar(255),
	"embedding" vector(2000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_centres" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"location" text,
	"manager_name" varchar(100),
	"manager_email" varchar(255),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defects" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer,
	"trailer_id" integer,
	"inspection_id" integer,
	"reported_by" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"supplier" varchar(255),
	"site" varchar(255),
	"required_by" timestamp,
	"cost" varchar(20) DEFAULT '0.00',
	"odometer" integer,
	"fleet_reference" varchar(100),
	"im_reference" varchar(100),
	"actioned_notes" text,
	"assigned_to" integer,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"photo" text,
	"ai_severity" varchar(20),
	"ai_category" varchar(50),
	"ai_confidence" integer,
	"ai_analysis" text,
	"ai_triaged" boolean DEFAULT false,
	"ai_triaged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"vehicle_id" integer,
	"customer_name" varchar(255) NOT NULL,
	"delivery_address" text,
	"reference_number" varchar(100),
	"signature_url" text NOT NULL,
	"photo_urls" jsonb NOT NULL,
	"delivery_notes" text,
	"gps_latitude" text,
	"gps_longitude" text,
	"gps_accuracy" integer,
	"arrived_at" timestamp,
	"departed_at" timestamp,
	"completed_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"invoiced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"head_of_department" varchar(100),
	"budget_code" varchar(50),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_acknowledgments" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"acknowledged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"file_url" text,
	"content" text,
	"priority" varchar(20) DEFAULT 'NORMAL',
	"requires_acknowledgment" boolean DEFAULT true,
	"expires_at" timestamp,
	"active" boolean DEFAULT true,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"license_number" varchar(20) NOT NULL,
	"first_name" text,
	"last_name" text,
	"date_of_birth" timestamp,
	"license_type" varchar(20),
	"license_status" varchar(20),
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"entitlements" jsonb,
	"endorsements" jsonb,
	"total_penalty_points" integer DEFAULT 0,
	"is_disqualified" boolean DEFAULT false,
	"disqualification_details" jsonb,
	"cpc_number" varchar(50),
	"cpc_expiry_date" timestamp,
	"tachograph_card_number" varchar(50),
	"tachograph_expiry_date" timestamp,
	"last_verified_at" timestamp,
	"last_verification_status" varchar(20),
	"next_verification_due" timestamp,
	"raw_dvla_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "driver_licenses_driver_id_unique" UNIQUE("driver_id")
);
--> statement-breakpoint
CREATE TABLE "driver_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"speed" integer DEFAULT 0 NOT NULL,
	"heading" integer,
	"accuracy" integer,
	"is_stagnant" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"description" text,
	"expiry_date" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"fuel_type" varchar(20) NOT NULL,
	"odometer" integer NOT NULL,
	"litres" integer,
	"price" integer,
	"location" text,
	"receipt_drive_file_id" text,
	"fuel_card_drive_file_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"radius_meters" integer DEFAULT 250 NOT NULL,
	"geofence_type" varchar(20) DEFAULT 'circle' NOT NULL,
	"polygon_coordinates" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"odometer" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"has_trailer" boolean DEFAULT false,
	"checklist" jsonb NOT NULL,
	"defects" jsonb,
	"cab_photos" jsonb,
	"drive_folder_id" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_seconds" integer,
	"vehicle_category" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"license_id" integer,
	"company_id" integer NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"acknowledged_by" integer,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"related_verification_id" integer,
	"expiry_date" timestamp,
	"penalty_points" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_upgrade_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"manager_id" integer NOT NULL,
	"message" text,
	"current_tier" varchar(20) NOT NULL,
	"requested_tier" varchar(20),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"license_id" integer,
	"company_id" integer NOT NULL,
	"verification_date" timestamp DEFAULT now() NOT NULL,
	"verification_type" varchar(20) NOT NULL,
	"verification_status" varchar(20) NOT NULL,
	"license_valid" boolean,
	"license_status" varchar(20),
	"penalty_points" integer,
	"is_disqualified" boolean,
	"changes_detected" boolean DEFAULT false,
	"changes_summary" text,
	"dvla_response" jsonb,
	"error_message" text,
	"initiated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"risk_level" varchar(20) NOT NULL,
	"risk_score" integer NOT NULL,
	"prediction" text NOT NULL,
	"recommendation" text NOT NULL,
	"based_on_defects" integer DEFAULT 0 NOT NULL,
	"category" varchar(50),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"acknowledged_by" integer,
	"acknowledged_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"category" varchar(50),
	"supplier" varchar(100),
	"booking_date" timestamp NOT NULL,
	"booking_time" varchar(10),
	"end_date" timestamp,
	"status" varchar(30) DEFAULT 'SCHEDULED' NOT NULL,
	"description" text,
	"cost_estimate" integer,
	"actual_cost" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"kind" varchar(50) NOT NULL,
	"linked_id" integer NOT NULL,
	"drive_file_id" text NOT NULL,
	"drive_url" text,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"vehicle_id" integer,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"email_enabled" boolean DEFAULT true,
	"sms_enabled" boolean DEFAULT false,
	"in_app_enabled" boolean DEFAULT true,
	"mot_expiry_enabled" boolean DEFAULT true,
	"tax_expiry_enabled" boolean DEFAULT true,
	"service_due_enabled" boolean DEFAULT true,
	"license_expiry_enabled" boolean DEFAULT true,
	"vor_status_enabled" boolean DEFAULT true,
	"defect_reported_enabled" boolean DEFAULT true,
	"inspection_failed_enabled" boolean DEFAULT true,
	"mot_expiry_days" integer DEFAULT 30,
	"tax_expiry_days" integer DEFAULT 30,
	"service_due_days" integer DEFAULT 14,
	"license_expiry_days" integer DEFAULT 30,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(500) NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"user_role" varchar(20) NOT NULL,
	"platform" varchar(20),
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer,
	"is_broadcast" boolean DEFAULT false NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_licence_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"licence_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_licences" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"licence_number" varchar(50) NOT NULL,
	"traffic_area" varchar(100) NOT NULL,
	"licence_type" varchar(50) NOT NULL,
	"vehicle_category" varchar(10) DEFAULT 'HGV' NOT NULL,
	"in_force_from" timestamp,
	"review_date" timestamp,
	"authorised_vehicles" integer DEFAULT 0 NOT NULL,
	"authorised_trailers" integer DEFAULT 0 NOT NULL,
	"safety_inspection_frequency" varchar(20) DEFAULT '6 weeks',
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"used" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pay_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer,
	"base_rate" varchar(10) DEFAULT '12.00' NOT NULL,
	"night_rate" varchar(10) DEFAULT '15.00' NOT NULL,
	"weekend_rate" varchar(10) DEFAULT '18.00' NOT NULL,
	"bank_holiday_rate" varchar(10) DEFAULT '24.00' NOT NULL,
	"overtime_multiplier" varchar(10) DEFAULT '1.5' NOT NULL,
	"night_start_hour" integer DEFAULT 22 NOT NULL,
	"night_end_hour" integer DEFAULT 6 NOT NULL,
	"daily_overtime_threshold" integer DEFAULT 840 NOT NULL,
	"weekly_overtime_threshold" integer DEFAULT 2400 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"company_name" text,
	"fleet_size" text,
	"tier" text,
	"payment_url" text,
	"user_agent" text,
	"ip" text,
	"contact_name" text,
	"phone" text,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rectifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"defect_id" integer NOT NULL,
	"mechanic_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'IN_PROGRESS' NOT NULL,
	"work_description" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"hours_worked" integer,
	"parts_used" jsonb DEFAULT '[]'::jsonb,
	"total_parts_cost" integer DEFAULT 0,
	"labour_cost" integer DEFAULT 0,
	"verified_by" integer,
	"verified_at" timestamp,
	"verification_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_company_id" integer NOT NULL,
	"referral_code" varchar(20) NOT NULL,
	"referred_company_id" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reward_type" varchar(50),
	"reward_value" integer,
	"reward_claimed" boolean DEFAULT false,
	"signed_up_at" timestamp,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"escalation_level" integer DEFAULT 0,
	"completed_at" timestamp,
	"completed_by" integer,
	"completion_notes" text,
	"snoozed_until" timestamp,
	"snoozed_by" integer,
	"snooze_reason" text,
	"last_notification_sent" timestamp,
	"notification_count" integer DEFAULT 0,
	"recurring" boolean DEFAULT false,
	"recurrence_interval" integer,
	"next_recurrence_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"service_date" timestamp NOT NULL,
	"service_mileage" integer NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"service_provider" text,
	"cost" integer,
	"work_performed" text,
	"next_service_due" timestamp,
	"next_service_mileage" integer,
	"invoice_url" text,
	"performed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_check_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_check_id" integer NOT NULL,
	"item_id" varchar(50) NOT NULL,
	"label" text NOT NULL,
	"item_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"value" text,
	"notes" text,
	"photo_url" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"timesheet_id" integer,
	"template_id" integer,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"completed_at" timestamp,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stagnation_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"stagnation_start_time" timestamp NOT NULL,
	"stagnation_duration_minutes" integer NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"acknowledged_by" integer,
	"acknowledged_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"depot_id" integer,
	"depot_name" varchar(100) NOT NULL,
	"arrival_time" timestamp NOT NULL,
	"departure_time" timestamp,
	"total_minutes" integer,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"arrival_latitude" text,
	"arrival_longitude" text,
	"departure_latitude" text,
	"departure_longitude" text,
	"arrival_accuracy" integer,
	"departure_accuracy" integer,
	"manual_depot_selection" boolean DEFAULT false NOT NULL,
	"adjustment_status" varchar(20),
	"adjustment_requested_by" integer,
	"adjustment_note" text,
	"original_arrival_time" timestamp,
	"original_departure_time" timestamp,
	"proposed_arrival_time" timestamp,
	"proposed_departure_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trailers" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"trailer_id" varchar(20) NOT NULL,
	"type" varchar(50) NOT NULL,
	"make" text,
	"model" text,
	"axles" integer DEFAULT 3,
	"mot_due" timestamp,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"phone" varchar(20),
	"pin" varchar(4),
	"password" text,
	"active" boolean DEFAULT true,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false,
	"permissions" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3b82f6',
	"icon" varchar(50) DEFAULT 'truck',
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_penalties" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer,
	"pcn_reference" varchar(100),
	"internal_reference" varchar(100),
	"penalty_type" varchar(50) NOT NULL,
	"penalty_date" timestamp NOT NULL,
	"amount" integer,
	"penalty_status" varchar(30) DEFAULT 'UNPAID' NOT NULL,
	"paid" boolean DEFAULT false,
	"paid_date" timestamp,
	"authority" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vrm" varchar(20) NOT NULL,
	"vin" varchar(17),
	"make" text NOT NULL,
	"model" text NOT NULL,
	"fleet_number" varchar(50),
	"vehicle_category" varchar(10) DEFAULT 'HGV',
	"mot_due" timestamp,
	"tax_due" timestamp,
	"active" boolean DEFAULT true,
	"vor_status" boolean DEFAULT false,
	"vor_reason" varchar(100),
	"vor_start_date" timestamp,
	"vor_notes" text,
	"vor_resolved_date" timestamp,
	"current_mileage" integer DEFAULT 0,
	"last_service_date" timestamp,
	"last_service_mileage" integer,
	"service_interval_miles" integer DEFAULT 10000,
	"service_interval_months" integer DEFAULT 12,
	"next_service_due" timestamp,
	"next_service_mileage" integer,
	"category_id" integer,
	"cost_centre_id" integer,
	"department_id" integer,
	"pending_review" boolean DEFAULT false,
	"added_by_driver_id" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wage_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"timesheet_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"pay_rate_id" integer NOT NULL,
	"regular_minutes" integer DEFAULT 0 NOT NULL,
	"night_minutes" integer DEFAULT 0 NOT NULL,
	"weekend_minutes" integer DEFAULT 0 NOT NULL,
	"bank_holiday_minutes" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"regular_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"night_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"weekend_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"bank_holiday_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"overtime_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"total_pay" varchar(10) DEFAULT '0.00' NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wage_calculations_timesheet_id_unique" UNIQUE("timesheet_id")
);
--> statement-breakpoint
ALTER TABLE "api_health_fixes" ADD CONSTRAINT "api_health_fixes_incident_id_api_health_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."api_health_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_health_fixes" ADD CONSTRAINT "api_health_fixes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_holidays" ADD CONSTRAINT "bank_holidays_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collisions" ADD CONSTRAINT "collisions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collisions" ADD CONSTRAINT "collisions_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collisions" ADD CONSTRAINT "collisions_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_car_register" ADD CONSTRAINT "company_car_register_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_car_register" ADD CONSTRAINT "company_car_register_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_check_templates" ADD CONSTRAINT "company_check_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centres" ADD CONSTRAINT "cost_centres_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_trailer_id_trailers_id_fk" FOREIGN KEY ("trailer_id") REFERENCES "public"."trailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_acknowledgments" ADD CONSTRAINT "document_acknowledgments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_acknowledgments" ADD CONSTRAINT "document_acknowledgments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_licenses" ADD CONSTRAINT "driver_licenses_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_licenses" ADD CONSTRAINT "driver_licenses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_locations" ADD CONSTRAINT "driver_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_locations" ADD CONSTRAINT "driver_locations_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_documents" ADD CONSTRAINT "fleet_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_alerts" ADD CONSTRAINT "license_alerts_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_alerts" ADD CONSTRAINT "license_alerts_license_id_driver_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."driver_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_alerts" ADD CONSTRAINT "license_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_alerts" ADD CONSTRAINT "license_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_alerts" ADD CONSTRAINT "license_alerts_related_verification_id_license_verifications_id_fk" FOREIGN KEY ("related_verification_id") REFERENCES "public"."license_verifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_upgrade_requests" ADD CONSTRAINT "license_upgrade_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_upgrade_requests" ADD CONSTRAINT "license_upgrade_requests_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_verifications" ADD CONSTRAINT "license_verifications_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_verifications" ADD CONSTRAINT "license_verifications_license_id_driver_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."driver_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_verifications" ADD CONSTRAINT "license_verifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_verifications" ADD CONSTRAINT "license_verifications_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_alerts" ADD CONSTRAINT "maintenance_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_alerts" ADD CONSTRAINT "maintenance_alerts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_alerts" ADD CONSTRAINT "maintenance_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_bookings" ADD CONSTRAINT "maintenance_bookings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_bookings" ADD CONSTRAINT "maintenance_bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_tokens" ADD CONSTRAINT "notification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_tokens" ADD CONSTRAINT "notification_tokens_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_licence_vehicles" ADD CONSTRAINT "operator_licence_vehicles_licence_id_operator_licences_id_fk" FOREIGN KEY ("licence_id") REFERENCES "public"."operator_licences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_licence_vehicles" ADD CONSTRAINT "operator_licence_vehicles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_licences" ADD CONSTRAINT "operator_licences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_rates" ADD CONSTRAINT "pay_rates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_rates" ADD CONSTRAINT "pay_rates_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rectifications" ADD CONSTRAINT "rectifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rectifications" ADD CONSTRAINT "rectifications_defect_id_defects_id_fk" FOREIGN KEY ("defect_id") REFERENCES "public"."defects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rectifications" ADD CONSTRAINT "rectifications_mechanic_id_users_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rectifications" ADD CONSTRAINT "rectifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_company_id_companies_id_fk" FOREIGN KEY ("referrer_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_company_id_companies_id_fk" FOREIGN KEY ("referred_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_snoozed_by_users_id_fk" FOREIGN KEY ("snoozed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_check_items" ADD CONSTRAINT "shift_check_items_shift_check_id_shift_checks_id_fk" FOREIGN KEY ("shift_check_id") REFERENCES "public"."shift_checks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_template_id_company_check_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."company_check_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_checks" ADD CONSTRAINT "shift_checks_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagnation_alerts" ADD CONSTRAINT "stagnation_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagnation_alerts" ADD CONSTRAINT "stagnation_alerts_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagnation_alerts" ADD CONSTRAINT "stagnation_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_depot_id_geofences_id_fk" FOREIGN KEY ("depot_id") REFERENCES "public"."geofences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trailers" ADD CONSTRAINT "trailers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_categories" ADD CONSTRAINT "vehicle_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_penalties" ADD CONSTRAINT "vehicle_penalties_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_penalties" ADD CONSTRAINT "vehicle_penalties_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_penalties" ADD CONSTRAINT "vehicle_penalties_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_usage" ADD CONSTRAINT "vehicle_usage_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_usage" ADD CONSTRAINT "vehicle_usage_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_usage" ADD CONSTRAINT "vehicle_usage_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_category_id_vehicle_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_cost_centre_id_cost_centres_id_fk" FOREIGN KEY ("cost_centre_id") REFERENCES "public"."cost_centres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_added_by_driver_id_users_id_fk" FOREIGN KEY ("added_by_driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_calculations" ADD CONSTRAINT "wage_calculations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_calculations" ADD CONSTRAINT "wage_calculations_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wage_calculations" ADD CONSTRAINT "wage_calculations_pay_rate_id_pay_rates_id_fk" FOREIGN KEY ("pay_rate_id") REFERENCES "public"."pay_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_compliance_knowledge_embedding_hnsw" ON "compliance_knowledge" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_company_pin_unique" ON "users" USING btree ("company_id","pin") WHERE "users"."pin" IS NOT NULL;