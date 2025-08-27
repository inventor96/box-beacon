<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250827032221 extends Migration
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
		CREATE TABLE `items` (
			`id` int(11) unsigned AUTO_INCREMENT PRIMARY KEY,
			`name` varchar(255) NOT NULL,
			`box_id` int(11) unsigned NOT NULL,
			`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
			FULLTEXT KEY `ft_name` (`name`)
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
		DROP TABLE IF EXISTS `items`;
		SQL);
	}
}
