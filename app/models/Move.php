<?php
namespace app\models;

use mako\database\midgard\ORM;

/**
 * @property int $id
 * @property string $name
 * @property Time $created_at
 * @property Time $updated_at
 */
class Move extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;

	protected array $cast = [
		'created_at' => 'date',
		'updated_at' => 'date',
	];

	protected array $assignable = [
		'name',
	];

	protected array $required_fields = [
		'name',
	];

	public function getValidatorSpec(): array
	{
		return [
			'name' => ['required'],
		];
	}
}