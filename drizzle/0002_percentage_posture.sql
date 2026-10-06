ALTER TABLE "implementation_statements" ADD COLUMN "current_percentage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "implementation_statements" ADD COLUMN "target_percentage" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
UPDATE "implementation_statements" SET "status" = 'not_started' WHERE "status" = 'partial';--> statement-breakpoint
UPDATE "implementation_statements" SET "current_percentage" = "target_percentage" WHERE "status" = 'implemented';--> statement-breakpoint
ALTER TABLE "implementation_statements" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "implementation_statements" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."implementation_status";--> statement-breakpoint
CREATE TYPE "public"."implementation_status" AS ENUM('not_started', 'implemented', 'not_applicable');--> statement-breakpoint
ALTER TABLE "implementation_statements" ALTER COLUMN "status" TYPE "public"."implementation_status" USING "status"::"public"."implementation_status";
