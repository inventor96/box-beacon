<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250907165826 extends Migration
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
		CREATE TABLE `boxes_tags` (
			`box_id` int(11) unsigned NOT NULL,
			`tag_id` int(11) unsigned NOT NULL,
			PRIMARY KEY (`box_id`, `tag_id`),
			FOREIGN KEY (`box_id`) REFERENCES `boxes`(`id`) ON DELETE CASCADE,
			FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
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
		DROP TABLE IF EXISTS `boxes_tags`;
		SQL);
	}
}
