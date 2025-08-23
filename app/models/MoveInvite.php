<?php
namespace app\models;

use mako\database\midgard\ORM;

/**
 * @property int $id
 * @property Move $move
 * @property string $email
 * @property Time $created_at
 */
class MoveInvite extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;

	protected array $cast = [
		'created_at' => 'date',
	];

	protected array $assignable = [
		'email',
	];

	protected array $required_fields = [
		'email',
	];

	public function getValidatorSpec(): array
	{
		return [
			'email' => ['required', 'email'],
		];
	}

	public function move()
	{
		return $this->belongsTo(Move::class);
	}
}