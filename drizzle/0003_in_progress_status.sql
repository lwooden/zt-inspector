ALTER TABLE "implementation_statements" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "implementation_statements" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."implementation_status";--> statement-breakpoint
CREATE TYPE "public"."implementation_status" AS ENUM('not_started', 'in_progress', 'implemented', 'not_applicable');--> statement-breakpoint
ALTER TABLE "implementation_statements" ALTER COLUMN "status" TYPE "public"."implementation_status" USING "status"::"public"."implementation_status";--> statement-breakpoint
UPDATE "implementation_statements"
SET "status" = 'in_progress'
WHERE "status" = 'not_started'
  AND "current_percentage" > 0
  AND "current_percentage" < "target_percentage";
