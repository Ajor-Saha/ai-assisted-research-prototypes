CREATE TABLE "tbl_user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	CONSTRAINT "tbl_user_email_unique" UNIQUE("email")
);
