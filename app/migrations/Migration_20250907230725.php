<?php

namespace app\migrations;

use mako\database\migrations\Migration;

class Migration_20250907230725 extends Migration
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
			DROP COLUMN `heavy`,
			DROP COLUMN `fragile`;
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
			ADD COLUMN `heavy` tinyint(1) NOT NULL DEFAULT 0,
			ADD COLUMN `fragile` tinyint(1) NOT NULL DEFAULT 0;
		SQL);
	}
}
