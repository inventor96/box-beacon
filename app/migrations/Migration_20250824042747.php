<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250824042747 extends Migration
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
		CREATE TABLE `boxes` (
			`id` int(11) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
			`move_id` int(11) unsigned NOT NULL,
			`number` int(11) unsigned NOT NULL,
			`heavy` tinyint(1) NOT NULL DEFAULT 0,
			`fragile` tinyint(1) NOT NULL DEFAULT 0,
			`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
			`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (`move_id`) REFERENCES `moves`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
		DROP TABLE IF EXISTS `boxes`;
		SQL);
	}
}
