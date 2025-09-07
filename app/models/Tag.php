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
 * @property string $name
 * @property string $color
 * @property Move $move
 * @property Box[]|ResultSet $boxes
 * @property Time $created_at
 * @property Time $updated_at
 */
class Tag extends ORM implements ValidatorSpecInterface
{
	use AssignRequireTrait;
	use AutoIdRelationTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;

	protected array $cast = [
	];

	protected array $assignable = [
		'name',
		'color',
	];

	protected array $required_fields = [
		'name',
	];

	public function getValidatorSpec(): array
	{
		return [
			'name' => ['required', 'string', 'max_length(255)'],
			'color' => ['optional', 'hex_color'], // e.g. #ffffff or #fff
		];
	}

	public function move()
	{
		return $this->belongsTo(Move::class);
	}

	public function boxes()
	{
		return $this->manyToMany(Box::class);
	}
}