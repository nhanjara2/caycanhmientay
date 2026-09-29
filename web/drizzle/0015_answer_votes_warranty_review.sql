CREATE TABLE "question_answer_votes" (
	"answer_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_answer_votes_answer_id_user_id_pk" PRIMARY KEY("answer_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD COLUMN "review_id" integer;--> statement-breakpoint
ALTER TABLE "question_answer_votes" ADD CONSTRAINT "question_answer_votes_answer_id_question_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."question_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answer_votes" ADD CONSTRAINT "question_answer_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_requests" ADD CONSTRAINT "warranty_requests_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "warranty_review_idx" ON "warranty_requests" USING btree ("review_id");--> statement-breakpoint
ALTER TABLE "question_answer_votes" ENABLE ROW LEVEL SECURITY;
