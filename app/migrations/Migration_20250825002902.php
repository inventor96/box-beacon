<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250825002902 extends Migration
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
		CREATE TABLE `rooms` (
			`id` int(11) unsigned AUTO_INCREMENT PRIMARY KEY,
			`name` varchar(255) NOT NULL,
			`location` ENUM('from', 'to') NOT NULL,
			`color` char(7) DEFAULT NULL,
			`move_id` int(11) unsigned NOT NULL,
			`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
			`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
		DROP TABLE IF EXISTS `rooms`;
		SQL);
	}
}
