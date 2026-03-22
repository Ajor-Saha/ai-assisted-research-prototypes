CREATE TABLE "tbl_material_chunks" (
	"chunk_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" text NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_order" integer NOT NULL,
	"chunk_type" varchar(50),
	"page_number" integer,
	"line_start" integer,
	"line_end" integer,
	"language" varchar(50),
	"is_code" boolean DEFAULT false,
	"chunk_metadata" jsonb,
	"vector_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "is_indexed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "indexed_at" timestamp;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "vector_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "chunk_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "parsing_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "tbl_material" ADD COLUMN "parsing_error" text;--> statement-breakpoint
ALTER TABLE "tbl_material_chunks" ADD CONSTRAINT "tbl_material_chunks_material_id_tbl_material_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."tbl_material"("material_id") ON DELETE cascade ON UPDATE no action;