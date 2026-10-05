CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"category_slug" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subcategories_category_slug_slug_pk" PRIMARY KEY("category_slug","slug")
);
--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subcategories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "categories" ("slug", "name", "icon", "sort", "specs") VALUES
('cay-canh', 'Cây cảnh', 'plant', 0, '[{"name":"Chiều cao"},{"name":"Chậu"},{"name":"Ánh sáng"},{"name":"Tưới nước"},{"name":"Nguồn gốc"},{"name":"An toàn thú cưng"}]'),
('hat-giong', 'Hạt giống – Cây giống', 'sprout', 1, '[{"name":"Tỉ lệ nảy mầm"},{"name":"Thời gian thu hoạch"},{"name":"Quy cách"}]'),
('thuoc-bvtv', 'Thuốc BVTV', 'flask', 2, '[{"name":"Số đăng ký","required":true},{"name":"Hoạt chất","required":true},{"name":"Liều pha","required":true},{"name":"Thời gian cách ly","required":true},{"name":"Quy cách"}]'),
('phan-bon', 'Phân bón – Dinh dưỡng', 'drop', 3, '[{"name":"Thành phần"},{"name":"Liều dùng"},{"name":"Quy cách"}]'),
('chau', 'Chậu – Phụ kiện chậu', 'pot', 4, '[{"name":"Kích thước"},{"name":"Chất liệu"},{"name":"Quy cách"}]'),
('dat-gia-the', 'Đất – Giá thể', 'box', 5, '[{"name":"Thành phần"},{"name":"Quy cách"}]'),
('trang-tri', 'Trang trí – Tiểu cảnh', 'leaf', 6, '[{"name":"Kích thước"},{"name":"Chất liệu"}]'),
('dung-cu', 'Dụng cụ làm vườn', 'tool', 7, '[{"name":"Chất liệu"},{"name":"Kích thước"}]'),
('thiet-bi', 'Thiết bị – Công nghệ', 'gauge', 8, '[{"name":"Chất liệu"},{"name":"Nguồn điện"},{"name":"Bảo hành"}]')
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "subcategories" ("category_slug", "slug", "name", "sort") VALUES
('cay-canh', 'cay-noi-that', 'Cây nội thất', 0),
('cay-canh', 'kieng-la', 'Kiểng lá', 1),
('cay-canh', 'sen-da-xuong-rong', 'Sen đá – Xương rồng', 2),
('cay-canh', 'lan', 'Lan', 3),
('cay-canh', 'bonsai', 'Bonsai', 4),
('cay-canh', 'cay-san-vuon', 'Cây sân vườn', 5),
('hat-giong', 'hat-rau', 'Hạt giống rau', 0),
('hat-giong', 'hat-hoa', 'Hạt giống hoa', 1),
('hat-giong', 'cay-giong', 'Cây giống ăn trái', 2),
('thuoc-bvtv', 'tru-sau', 'Thuốc trừ sâu', 0),
('thuoc-bvtv', 'tru-nam', 'Thuốc trừ nấm bệnh', 1),
('thuoc-bvtv', 'tru-nhen-rep', 'Thuốc trừ nhện – rệp – bọ trĩ', 2),
('thuoc-bvtv', 'tru-oc-sen', 'Thuốc trừ ốc sên', 3),
('thuoc-bvtv', 'sinh-hoc', 'Chế phẩm sinh học', 4),
('phan-bon', 'phan-tan-cham', 'Phân tan chậm', 0),
('phan-bon', 'phan-bon-la', 'Phân bón lá', 1),
('phan-bon', 'huu-co', 'Phân hữu cơ', 2),
('phan-bon', 'kich-re', 'Kích rễ – Kích chồi', 3),
('chau', 'chau-su', 'Chậu sứ', 0),
('chau', 'chau-nhua', 'Chậu nhựa', 1),
('chau', 'chau-tu-tuoi', 'Chậu tự tưới', 2),
('dat-gia-the', 'dat-tron-san', 'Đất trộn sẵn', 0),
('dat-gia-the', 'gia-the', 'Giá thể – Xơ dừa', 1),
('trang-tri', 'tieu-canh', 'Tiểu cảnh', 0),
('dung-cu', 'keo-cat-tia', 'Kéo cắt tỉa', 0),
('dung-cu', 'binh-tuoi', 'Bình tưới', 1),
('thiet-bi', 'tuoi-tu-dong', 'Tưới tự động', 0)
ON CONFLICT DO NOTHING;
