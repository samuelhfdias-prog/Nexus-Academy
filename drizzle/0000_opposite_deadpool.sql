CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE TABLE `participation_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`userId` integer NOT NULL,
	`message` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`reviewedBy` integer,
	`reviewedAt` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `participation_requests_project_idx` ON `participation_requests` (`projectId`);--> statement-breakpoint
CREATE INDEX `participation_requests_user_idx` ON `participation_requests` (`userId`);--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`userId` integer NOT NULL,
	`memberRole` text DEFAULT 'membro',
	`joinedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_members_project_idx` ON `project_members` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_members_user_idx` ON `project_members` (`userId`);--> statement-breakpoint
CREATE TABLE `project_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`skillId` integer NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_skills_project_idx` ON `project_skills` (`projectId`);--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pendente' NOT NULL,
	`assignedTo` integer,
	`createdBy` integer NOT NULL,
	`dueDate` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_tasks_project_idx` ON `project_tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_tasks_assigned_idx` ON `project_tasks` (`assignedTo`);--> statement-breakpoint
CREATE TABLE `project_timeline` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`projectId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`eventDate` text NOT NULL,
	`eventType` text DEFAULT 'outro' NOT NULL,
	`createdBy` integer NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `project_timeline_project_idx` ON `project_timeline` (`projectId`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`thematicArea` text NOT NULL,
	`status` text DEFAULT 'ativo' NOT NULL,
	`approvalStatus` text DEFAULT 'rascunho' NOT NULL,
	`ownerId` integer NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`imageUrl` text,
	`tags` text,
	`maxMembers` integer DEFAULT 10,
	`isPublic` integer DEFAULT true NOT NULL,
	`submittedAt` text,
	`reviewedBy` integer,
	`reviewedAt` text,
	`rejectionReason` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `projects_owner_idx` ON `projects` (`ownerId`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_approval_idx` ON `projects` (`approvalStatus`);--> statement-breakpoint
CREATE INDEX `projects_area_idx` ON `projects` (`thematicArea`);--> statement-breakpoint
CREATE INDEX `projects_reviewed_by_idx` ON `projects` (`reviewedBy`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skills_name_unique` ON `skills` (`name`);--> statement-breakpoint
CREATE TABLE `student_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`thematicArea` text NOT NULL,
	`studentId` integer NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`submittedAt` text,
	`reviewedBy` integer,
	`reviewedAt` text,
	`rejectionReason` text,
	`linkedProjectId` integer,
	`tags` text,
	`suggestedMaxMembers` integer DEFAULT 5,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`linkedProjectId`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `student_projects_student_idx` ON `student_projects` (`studentId`);--> statement-breakpoint
CREATE INDEX `student_projects_status_idx` ON `student_projects` (`status`);--> statement-breakpoint
CREATE INDEX `student_projects_area_idx` ON `student_projects` (`thematicArea`);--> statement-breakpoint
CREATE INDEX `student_projects_reviewed_by_idx` ON `student_projects` (`reviewedBy`);--> statement-breakpoint
CREATE INDEX `student_projects_linked_idx` ON `student_projects` (`linkedProjectId`);--> statement-breakpoint
CREATE TABLE `user_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`skillId` integer NOT NULL,
	`level` text DEFAULT 'basico' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_skills_user_idx` ON `user_skills` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'aluno' NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`institution` text,
	`course` text,
	`semester` integer,
	`birthDate` text,
	`passwordHash` text,
	`failedLoginAttempts` integer DEFAULT 0 NOT NULL,
	`lockedUntil` integer,
	`lastFailedLogin` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastSignedIn` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);