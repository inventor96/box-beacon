<?php
namespace app\models;

use app\interfaces\ValidatorSpecInterface;
use app\traits\AssignRequireTrait;
use app\traits\AutoIdRelationTrait;
use app\traits\OrmInstanceGetTrait;
use mako\chrono\Time;
use mako\database\midgard\ORM;
use mako\database\midgard\traits\TimestampedTrait;

/**
 * @property int $id
 * @property Move $move
 * @property string $email
 * @property Time $created_at
 * @property Time $updated_at
 */
class MoveInvite extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;

	protected array $cast = [
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