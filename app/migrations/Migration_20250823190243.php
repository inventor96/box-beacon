<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250823190243 extends Migration
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
		ALTER TABLE `users`
			ADD COLUMN `active_move_id` int(11) unsigned NULL AFTER `last_name`,
			ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`active_move_id`) REFERENCES `moves`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
		SQL);
	}

	/**
	 * Reverts the database changes.
	 */
	public function down(): void
	{
		$this->getConnection()->query
		(<<<SQL
		ALTER TABLE `users`
			DROP COLUMN `active_move_id`,
			DROP FOREIGN KEY `users_ibfk_1`;
		SQL);
	}
}
