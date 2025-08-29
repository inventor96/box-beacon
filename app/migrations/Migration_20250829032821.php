<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250829032821 extends Migration
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
		ALTER TABLE `move_invites`
			ADD COLUMN `token` varchar(64) NOT NULL,
			ADD COLUMN `accepted` tinyint(1) DEFAULT '0'
		SQL);
	}

	/**
	 * Reverts the database changes.
	 */
	public function down(): void
	{
		$this->getConnection()->query
		(<<<SQL
		ALTER TABLE `move_invites`
			DROP COLUMN `token`,
			DROP COLUMN `accepted`
		SQL);
	}
}
