CREATE TABLE "tbl_math_message_web_search" (
	"search_id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"math_chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"search_query" varchar(512) NOT NULL,
	"summary" text NOT NULL,
	"sources" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tbl_math_message_web_search" ADD CONSTRAINT "tbl_math_message_web_search_message_id_tbl_math_chat_message_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."tbl_math_chat_message"("message_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tbl_math_message_web_search" ADD CONSTRAINT "tbl_math_message_web_search_math_chat_id_tbl_math_chat_math_chat_id_fk" FOREIGN KEY ("math_chat_id") REFERENCES "public"."tbl_math_chat"("math_chat_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tbl_math_message_web_search" ADD CONSTRAINT "tbl_math_message_web_search_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_math_web_search_message_id_created_at" ON "tbl_math_message_web_search" USING btree ("message_id","created_at" DESC);
--> statement-breakpoint
CREATE INDEX "idx_math_web_search_chat_id" ON "tbl_math_message_web_search" USING btree ("math_chat_id");
