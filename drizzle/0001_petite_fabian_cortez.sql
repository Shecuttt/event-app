ALTER TABLE "users" ADD COLUMN "is_organizer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."role";