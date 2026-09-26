CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`street` text NOT NULL,
	`area` text NOT NULL,
	`kind` text DEFAULT 'home' NOT NULL,
	`conditions` text DEFAULT '[]' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE TABLE `stock_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_slug` text NOT NULL,
	`option_idx` integer NOT NULL,
	`delta` integer NOT NULL,
	`after` integer NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`actor` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stock_moves_product_idx` ON `stock_moves` (`product_slug`,`option_idx`);--> statement-breakpoint
CREATE TABLE `warranty_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` integer NOT NULL,
	`file` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `warranty_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warranty_photos_file_unique` ON `warranty_photos` (`file`);--> statement-breakpoint
CREATE TABLE `warranty_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`order_item_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`symptoms` text NOT NULL,
	`description` text,
	`placement` text,
	`watering` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolution` text,
	`cause` text,
	`engineer_note` text,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `warranty_user_idx` ON `warranty_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `warranty_status_idx` ON `warranty_requests` (`status`);