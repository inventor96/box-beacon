<?php
namespace app\models;

use mako\database\midgard\ORM;
use mako\database\midgard\ResultSet;
use mako\database\midgard\traits\TimestampedTrait;

/**
 * @property int $id
 * @property string $name
 * @property User $user
 * @property MoveInvite[]|ResultSet $moveInvites
 * @property Box[]|ResultSet $boxes
 * @property Time $created_at
 * @property Time $updated_at
 */
class Move extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;

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

	public function users()
	{
		return $this->manyToMany(User::class);
	}

	public function moveInvites()
	{
		return $this->hasMany(MoveInvite::class);
	}

	public function boxes()
	{
		return $this->hasMany(Box::class);
	}
}