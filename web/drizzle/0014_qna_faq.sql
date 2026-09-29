CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_slug" text,
	"ship" text,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"question_id" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_product_slug_products_slug_fk" FOREIGN KEY ("product_slug") REFERENCES "public"."products"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faqs_product_idx" ON "faqs" USING btree ("product_slug","sort");--> statement-breakpoint
CREATE INDEX "faqs_question_idx" ON "faqs" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_answers_question_idx" ON "question_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_answers_user_idx" ON "question_answers" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "question_answers_status_idx" ON "question_answers" USING btree ("status");--> statement-breakpoint
ALTER TABLE "question_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "faqs" ("ship", "question", "answer", "sort", "created_by") VALUES
	('plant', 'Cây có trồng trong phòng máy lạnh được không?', 'Được. Tránh đặt ngay hướng gió máy lạnh thổi, và phun sương cho lá 2–3 lần/tuần vì không khí phòng lạnh khô.', 10, 'Hệ thống'),
	('plant', 'Cây bị vàng lá sau khi nhận hàng có được đổi không?', 'Cây được bảo hành 7 ngày kể từ khi nhận. Bạn chụp ảnh cây và gửi yêu cầu trong mục Tài khoản → Bảo hành cây, kỹ sư sẽ phản hồi trong 24 giờ.', 20, 'Hệ thống'),
	('plant', 'Bao lâu thì nên thay chậu?', 'Khoảng 12–18 tháng, hoặc khi thấy rễ mọc ra lỗ thoát nước. Nên thay vào đầu mùa mưa.', 30, 'Hệ thống'),
	('supply', 'Pha thuốc thế nào cho đúng liều?', 'Làm đúng liều ghi trên bao bì và trong bảng thông số. Không tự tăng liều, không trộn nhiều loại thuốc khi chưa hỏi kỹ sư.', 10, 'Hệ thống'),
	('supply', 'Hàng vật tư giao trong bao lâu?', 'Nội thành giao nhanh 2 giờ; tỉnh khác 2–4 ngày qua đơn vị vận chuyển.', 20, 'Hệ thống'),
	('supply', 'Có xuất hóa đơn điện tử không?', 'Có. Bật "Yêu cầu xuất hóa đơn điện tử" ở bước thanh toán và điền thông tin công ty.', 30, 'Hệ thống');
