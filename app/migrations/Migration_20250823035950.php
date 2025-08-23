<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250823035950 extends Migration
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
		CREATE TABLE IF NOT EXISTS `moves_users` (
			`move_id` int(11) unsigned NOT NULL,
			`user_id` int(11) unsigned NOT NULL,
			PRIMARY KEY (`move_id`, `user_id`),
			INDEX `move_id_idx` (`move_id`),
			INDEX `user_id_idx` (`user_id`),
			CONSTRAINT `moves_users_ibfk_1` FOREIGN KEY (`move_id`) REFERENCES `moves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
			CONSTRAINT `moves_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
		DROP TABLE IF EXISTS `moves_users`;
		SQL);
	}
}
