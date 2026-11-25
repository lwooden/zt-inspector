ALTER TABLE "implementation_statements" ADD COLUMN "verified_by_project_manager_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "implementation_statements" ADD COLUMN "verified_by_product_manager_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "implementation_statements" ADD COLUMN "verified_by_zt_lead_at" timestamp with time zone;--> statement-breakpoint
UPDATE "implementation_statements"
SET "verified_by_project_manager_at" = "verified_at"
WHERE "verified_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "implementation_statements" DROP COLUMN "verified_at";
