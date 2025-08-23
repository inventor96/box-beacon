<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250823092305 extends Migration
{
	/**
	 * Description.
	 */
	protected string $description = '';

	/**
	 * Makes changes to the database structure.
	 */
	public function up(): void
	{
		$this->getConnection()->query
		(<<<SQL
		CREATE TABLE `move_invites` (
			`id` int(11) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
			`move_id` int(11) unsigned NOT NULL,
			`email` varchar(255) NOT NULL,
			`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
			INDEX `idx_email` (`email`),
			CONSTRAINT `fk_move` FOREIGN KEY (`move_id`) REFERENCES `moves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
		);
		SQL);
	}

	/**
	 * Reverts the database changes.
	 */
	public function down(): void
	{
		$this->getConnection()->query
		(<<<SQL
		DROP TABLE IF EXISTS `move_invites`;
		SQL);
	}
}
