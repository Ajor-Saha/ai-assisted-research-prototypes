CREATE TABLE IF NOT EXISTS "tbl_study_path" (
  "study_path_id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "course_id" text NOT NULL,
  "title" varchar(255) NOT NULL,
  "summary" text NOT NULL,
  "exam_date" timestamp,
  "ai_model" varchar(120) DEFAULT 'gemini-2.5-flash',
  "tasks" jsonb NOT NULL,
  "insights" jsonb NOT NULL,
  "generated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT current_timestamp
);

DO $$ BEGIN
  ALTER TABLE "tbl_study_path"
    ADD CONSTRAINT "tbl_study_path_user_id_tbl_user_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "tbl_study_path"
    ADD CONSTRAINT "tbl_study_path_course_id_tbl_course_course_id_fk"
    FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
