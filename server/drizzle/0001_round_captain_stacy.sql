CREATE TABLE "tbl_course" (
	"course_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(50) DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_topic" (
	"topic_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_material" (
	"material_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"topic_id" text,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"file_size" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_chat" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_chat_message" (
	"message_id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_quiz" (
	"quiz_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"time_limit" integer,
	"passing_score" integer DEFAULT 70,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_quiz_question" (
	"question_id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"question" text NOT NULL,
	"question_type" varchar(50) NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" jsonb NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_short_qa" (
	"qa_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_course" ADD CONSTRAINT "tbl_course_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_topic" ADD CONSTRAINT "tbl_topic_course_id_tbl_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD CONSTRAINT "tbl_material_course_id_tbl_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_material" ADD CONSTRAINT "tbl_material_topic_id_tbl_topic_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."tbl_topic"("topic_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_chat" ADD CONSTRAINT "tbl_chat_course_id_tbl_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_chat" ADD CONSTRAINT "tbl_chat_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_chat_message" ADD CONSTRAINT "tbl_chat_message_chat_id_tbl_chat_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."tbl_chat"("chat_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_quiz" ADD CONSTRAINT "tbl_quiz_course_id_tbl_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_quiz_question" ADD CONSTRAINT "tbl_quiz_question_quiz_id_tbl_quiz_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."tbl_quiz"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_short_qa" ADD CONSTRAINT "tbl_short_qa_course_id_tbl_course_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tbl_course"("course_id") ON DELETE cascade ON UPDATE no action;