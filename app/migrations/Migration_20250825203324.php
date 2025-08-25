<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250825203324 extends Migration
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
		ALTER TABLE `boxes`
			ADD COLUMN `from_room_id` int(11) unsigned NULL AFTER `number`,
			ADD COLUMN `to_room_id` int(11) unsigned NULL AFTER `from_room_id`,
			ADD CONSTRAINT `fk_boxes_from_room` FOREIGN KEY (`from_room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
			ADD CONSTRAINT `fk_boxes_to_room` FOREIGN KEY (`to_room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
		SQL);
	}

	/**
	 * Reverts the database changes.
	 */
	public function down(): void
	{
		$this->getConnection()->query
		(<<<SQL
			ALTER TABLE `boxes`
				DROP FOREIGN KEY `fk_boxes_from_room`,
				DROP FOREIGN KEY `fk_boxes_to_room`,
				DROP COLUMN `from_room_id`,
				DROP COLUMN `to_room_id`
		SQL);
	}
}
