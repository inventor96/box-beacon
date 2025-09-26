USE boxbeacon;
CREATE TABLE `mako_migrations`
(
	`batch` int(10) unsigned NOT NULL,
	`package` varchar(255) DEFAULT NULL,
	`version` varchar(255) NOT NULL
);