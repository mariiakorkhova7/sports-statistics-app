CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `age` integer NOT NULL CHECK (age >= 6),
  `sex` enum('male','female') NOT NULL,
  `skill_level` enum('beginner','intermediate','advanced','professional') NOT NULL,
  `playing_hand` enum('left','right') NOT NULL,
  `created_at` timestamp
);

CREATE TABLE `user_roles` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer NOT NULL,
  `role` enum('player','organizer') NOT NULL
);

CREATE TABLE `tournaments` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `location` varchar(255),
  `status` enum('upcoming','ongoing','completed','cancelled') NOT NULL,
  `created_by_user_id` integer NOT NULL,
  `created_at` timestamp,
  `updated_at` timestamp,
  `max_sets` tinyint,
  `points_to_win` integer NOT NULL,
  `win_by_two` tinyint(1) NOT NULL,
  `max_points` integer
);

CREATE TABLE `tournament_events` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `tournament_id` integer NOT NULL,
  `category` enum('MS','WS','MD','WD','XD') NOT NULL,
  `name` varchar(255),
  `min_age` integer DEFAULT NULL,
  `max_age` integer DEFAULT NULL
);

CREATE TABLE `tournament_participants` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `tournament_event_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `registration_date` timestamp
);

CREATE TABLE `teams` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `tournament_event_id` integer NOT NULL,
  `player1_id` integer NOT NULL,
  `player2_id` integer,
  `created_at` timestamp
);

CREATE TABLE `matches` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `tournament_event_id` integer NOT NULL,
  `match_date` datetime NOT NULL,
  `match_level` enum('regular','final','third_place_playoff') DEFAULT 'regular',
  `winner_team_id` integer,
  `created_by_user_id` integer NOT NULL,
  `status` enum('scheduled','ongoing','completed','cancelled'),
  `created_at` timestamp
);

CREATE TABLE `match_participants` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `match_id` integer NOT NULL,
  `team_id` integer NOT NULL,
  `participant_slot` enum('p1','p2') NOT NULL
);

CREATE TABLE `match_sets` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `match_id` integer NOT NULL,
  `set_number` tinyint NOT NULL,
  `p1_score` tinyint NOT NULL,
  `p2_score` tinyint NOT NULL,
  `winner_slot` enum('p1','p2') NOT NULL
);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `tournaments` ADD FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `tournament_events` ADD FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`);

ALTER TABLE `tournament_participants` ADD FOREIGN KEY (`tournament_event_id`) REFERENCES `tournament_events` (`id`);

ALTER TABLE `tournament_participants` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `teams` ADD FOREIGN KEY (`tournament_event_id`) REFERENCES `tournament_events` (`id`);

ALTER TABLE `teams` ADD FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`);

ALTER TABLE `teams` ADD FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`);

ALTER TABLE `matches` ADD FOREIGN KEY (`tournament_event_id`) REFERENCES `tournament_events` (`id`);

ALTER TABLE `matches` ADD FOREIGN KEY (`winner_team_id`) REFERENCES `teams` (`id`);

ALTER TABLE `matches` ADD FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `match_participants` ADD FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`);

ALTER TABLE `match_participants` ADD FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`);

ALTER TABLE `match_sets` ADD FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`);

ALTER TABLE `match_participants` ADD UNIQUE KEY `match_slot_unique` (`match_id`, `participant_slot`);

ALTER TABLE `match_sets` ADD UNIQUE KEY `match_set_unique` (`match_id`, `set_number`);

ALTER TABLE `tournament_participants` ADD UNIQUE KEY `event_participant_unique` (`tournament_event_id`, `user_id`);

ALTER TABLE `user_roles` ADD UNIQUE KEY `user_role_unique` (`user_id`, `role`);