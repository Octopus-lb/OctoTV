CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `admin_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`metadata_json` text,
	`ip_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_action_idx` ON `admin_audit_logs` (`action`);--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_user_unique` ON `admin_users` (`user_id`);--> statement-breakpoint
CREATE TABLE `audio_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`playback_asset_id` text NOT NULL,
	`language` text NOT NULL,
	`label` text NOT NULL,
	`codec` text,
	`channels` text,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`playback_asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `audio_tracks_asset_idx` ON `audio_tracks` (`playback_asset_id`);--> statement-breakpoint
CREATE TABLE `cast_members` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'tmdb' NOT NULL,
	`source_id` integer NOT NULL,
	`name` text NOT NULL,
	`profile_path` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cast_members_source_unique` ON `cast_members` (`source`,`source_id`);--> statement-breakpoint
CREATE TABLE `channel_blocklist` (
	`id` text PRIMARY KEY NOT NULL,
	`iptv_org_id` text,
	`reason` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channel_blocklist_iptv_unique` ON `channel_blocklist` (`iptv_org_id`);--> statement-breakpoint
CREATE TABLE `channel_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`category` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `channel_health` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text,
	`source_id` text,
	`status` text NOT NULL,
	`latency_ms` integer,
	`message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `channel_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `channel_health_channel_idx` ON `channel_health` (`channel_id`);--> statement-breakpoint
CREATE TABLE `channel_languages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`language` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `channel_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`url` text NOT NULL,
	`quality` text,
	`referrer` text,
	`user_agent` text,
	`labels_json` text,
	`rights_status` text DEFAULT 'unknown' NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`health_status` text DEFAULT 'unknown' NOT NULL,
	`last_checked_at` integer,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `channel_sources_channel_idx` ON `channel_sources` (`channel_id`);--> statement-breakpoint
CREATE TABLE `channels` (
	`id` text PRIMARY KEY NOT NULL,
	`iptv_org_id` text NOT NULL,
	`name` text NOT NULL,
	`alt_names` text,
	`country` text,
	`languages_json` text,
	`categories_json` text,
	`logo_url` text,
	`website` text,
	`is_nsfw` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`synced_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channels_iptv_unique` ON `channels` (`iptv_org_id`);--> statement-breakpoint
CREATE INDEX `channels_country_idx` ON `channels` (`country`);--> statement-breakpoint
CREATE INDEX `channels_enabled_idx` ON `channels` (`enabled`);--> statement-breakpoint
CREATE TABLE `custom_list_items` (
	`list_id` text NOT NULL,
	`title_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`list_id`, `title_id`),
	FOREIGN KEY (`list_id`) REFERENCES `custom_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `custom_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `custom_lists_profile_idx` ON `custom_lists` (`profile_id`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text,
	`name` text,
	`user_agent` text,
	`last_seen_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `devices_user_idx` ON `devices` (`user_id`);--> statement-breakpoint
CREATE TABLE `download_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`playback_asset_id` text NOT NULL,
	`provider_key` text NOT NULL,
	`external_file_id` text,
	`file_url` text,
	`format` text DEFAULT 'mp4' NOT NULL,
	`quality` text,
	`size_bytes` integer,
	`rights_verified` integer DEFAULT false NOT NULL,
	`download_allowed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`playback_asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `download_assets_asset_idx` ON `download_assets` (`playback_asset_id`);--> statement-breakpoint
CREATE TABLE `download_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`download_asset_id` text NOT NULL,
	`ip_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`download_asset_id`) REFERENCES `download_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `download_events_user_idx` ON `download_events` (`user_id`);--> statement-breakpoint
CREATE TABLE `epg_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`locale` text,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `epg_programs_channel_time_idx` ON `epg_programs` (`channel_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`season_id` text NOT NULL,
	`season_number` integer NOT NULL,
	`episode_number` integer NOT NULL,
	`title` text,
	`overview` text,
	`runtime_minutes` integer,
	`air_date` text,
	`still_path` text,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episodes_unique` ON `episodes` (`title_id`,`season_number`,`episode_number`);--> statement-breakpoint
CREATE TABLE `external_ids` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`source` text NOT NULL,
	`external_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_ids_unique` ON `external_ids` (`source`,`external_id`);--> statement-breakpoint
CREATE INDEX `external_ids_title_idx` ON `external_ids` (`title_id`);--> statement-breakpoint
CREATE TABLE `genres` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'tmdb' NOT NULL,
	`source_id` integer,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `genres_slug_source_unique` ON `genres` (`slug`,`source`);--> statement-breakpoint
CREATE TABLE `playback_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`episode_id` text,
	`provider_key` text NOT NULL,
	`external_asset_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`license_starts_at` integer,
	`license_ends_at` integer,
	`download_allowed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playback_assets_title_idx` ON `playback_assets` (`title_id`);--> statement-breakpoint
CREATE INDEX `playback_assets_episode_idx` ON `playback_assets` (`episode_id`);--> statement-breakpoint
CREATE TABLE `playback_health_events` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`status` text NOT NULL,
	`latency_ms` integer,
	`message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `playback_servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playback_health_server_idx` ON `playback_health_events` (`server_id`);--> statement-breakpoint
CREATE TABLE `playback_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_key` text NOT NULL,
	`display_name` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`config_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playback_providers_key_unique` ON `playback_providers` (`provider_key`);--> statement-breakpoint
CREATE TABLE `playback_servers` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`server_key` text NOT NULL,
	`display_name` text NOT NULL,
	`provider_key` text NOT NULL,
	`region` text,
	`priority` integer DEFAULT 100 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`formats_json` text,
	`qualities_json` text,
	`manifest_url` text,
	`manifest_type` text,
	`last_health_check` integer,
	`health_status` text DEFAULT 'unknown' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playback_servers_unique` ON `playback_servers` (`asset_id`,`server_key`);--> statement-breakpoint
CREATE INDEX `playback_servers_asset_idx` ON `playback_servers` (`asset_id`);--> statement-breakpoint
CREATE TABLE `playback_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text,
	`asset_id` text NOT NULL,
	`provider_key` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playback_sessions_token_unique` ON `playback_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `playback_sessions_user_idx` ON `playback_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `playback_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`server_id` text,
	`quality` text NOT NULL,
	`width` integer,
	`height` integer,
	`bitrate` integer,
	`codec` text,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`server_id`) REFERENCES `playback_servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playback_variants_asset_idx` ON `playback_variants` (`asset_id`);--> statement-breakpoint
CREATE TABLE `profile_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`subtitle_language` text,
	`audio_language` text,
	`autoplay_next` integer DEFAULT true NOT NULL,
	`autoplay_previews` integer DEFAULT false NOT NULL,
	`subtitle_size` text DEFAULT 'medium' NOT NULL,
	`reduced_motion` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_preferences_profile_unique` ON `profile_preferences` (`profile_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`pin_hash` text,
	`preferred_locale` text,
	`maturity_level` text DEFAULT 'all' NOT NULL,
	`is_kids` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profiles_user_idx` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`recommended_title_id` text NOT NULL,
	`score` real,
	`source` text DEFAULT 'tmdb' NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recommended_title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_unique` ON `recommendations` (`title_id`,`recommended_title_id`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`season_number` integer NOT NULL,
	`title` text,
	`overview` text,
	`episode_count` integer,
	`air_date` text,
	`poster_path` text,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seasons_unique` ON `seasons` (`title_id`,`season_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `subtitle_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`playback_asset_id` text NOT NULL,
	`language` text NOT NULL,
	`label` text NOT NULL,
	`format` text DEFAULT 'vtt' NOT NULL,
	`file_url` text,
	`is_default` integer DEFAULT false NOT NULL,
	`is_forced` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`playback_asset_id`) REFERENCES `playback_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subtitle_tracks_asset_idx` ON `subtitle_tracks` (`playback_asset_id`);--> statement-breakpoint
CREATE TABLE `sync_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_type` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`items_processed` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`triggered_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sync_jobs_type_idx` ON `sync_jobs` (`job_type`);--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`context_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `sync_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sync_logs_job_idx` ON `sync_logs` (`job_id`);--> statement-breakpoint
CREATE TABLE `title_cast` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`cast_member_id` text NOT NULL,
	`character` text,
	`department` text DEFAULT 'cast' NOT NULL,
	`ordering` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cast_member_id`) REFERENCES `cast_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `title_cast_title_idx` ON `title_cast` (`title_id`);--> statement-breakpoint
CREATE TABLE `title_genres` (
	`title_id` text NOT NULL,
	`genre_id` text NOT NULL,
	PRIMARY KEY(`title_id`, `genre_id`),
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `title_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`title_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`overview` text,
	`tagline` text,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `title_translations_unique` ON `title_translations` (`title_id`,`locale`);--> statement-breakpoint
CREATE TABLE `titles` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`tmdb_id` integer,
	`anilist_id` integer,
	`imdb_id` text,
	`original_title` text NOT NULL,
	`original_language` text,
	`release_date` text,
	`status` text,
	`runtime_minutes` integer,
	`episode_count` integer,
	`season_count` integer,
	`poster_path` text,
	`backdrop_path` text,
	`trailer_key` text,
	`overview` text,
	`tagline` text,
	`vote_average` real,
	`popularity` real,
	`is_adult` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`metadata_json` text,
	`source_updated_at` integer,
	`synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `titles_tmdb_unique` ON `titles` (`tmdb_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `titles_anilist_unique` ON `titles` (`anilist_id`);--> statement-breakpoint
CREATE INDEX `titles_type_idx` ON `titles` (`type`);--> statement-breakpoint
CREATE INDEX `titles_popularity_idx` ON `titles` (`popularity`);--> statement-breakpoint
CREATE INDEX `titles_release_idx` ON `titles` (`release_date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`preferred_locale` text DEFAULT 'ar' NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `watch_history` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`title_id` text NOT NULL,
	`episode_id` text,
	`watched_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `watch_history_profile_idx` ON `watch_history` (`profile_id`);--> statement-breakpoint
CREATE TABLE `watch_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`title_id` text NOT NULL,
	`episode_id` text,
	`position_seconds` real DEFAULT 0 NOT NULL,
	`duration_seconds` real,
	`completed` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watch_progress_unique` ON `watch_progress` (`profile_id`,`title_id`,`episode_id`);--> statement-breakpoint
CREATE INDEX `watch_progress_profile_idx` ON `watch_progress` (`profile_id`);--> statement-breakpoint
CREATE TABLE `watchlist_items` (
	`watchlist_id` text NOT NULL,
	`title_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`watchlist_id`, `title_id`),
	FOREIGN KEY (`watchlist_id`) REFERENCES `watchlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `watchlists` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text DEFAULT 'Watchlist' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `watchlists_profile_idx` ON `watchlists` (`profile_id`);