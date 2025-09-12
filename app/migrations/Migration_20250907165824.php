<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250907165824 extends Migration
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
		CREATE TABLE `tags` (
			`id` int(11) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
			`name` varchar(255) NOT NULL,
			`color` char(7) DEFAULT NULL,
			`move_id` int(11) unsigned NOT NULL,
			`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
			`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (`move_id`) REFERENCES `moves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
		DROP TABLE IF EXISTS `tags`;
		SQL);
	}
}
