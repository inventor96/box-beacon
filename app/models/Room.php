<?php
namespace app\models;

use app\enums\RoomLocation;
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
 * @property RoomLocation $location
 * @property string $color
 * @property Move $move
 * @property Time $created_at
 * @property Time $updated_at
 */
class Room extends ORM implements ValidatorSpecInterface
{
	use AssignRequireTrait;
	use AutoIdRelationTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;

	protected array $cast = [
	];

	protected array $assignable = [
		'name',
		'location',
		'color',
	];

	protected array $required_fields = [
		'name',
		'location',
	];

	public function getValidatorSpec(): array
	{
		return [
			'name' => ['required', 'string', 'max_length(255)'],
			'location' => ['required', 'enum(' . json_encode(RoomLocation::class) . ')'],
			'color' => ['optional', 'hex_color'], // e.g. #ffffff or #fff
		];
	}

	public function move()
	{
		return $this->belongsTo(Move::class);
	}

	public function boxes()
	{
		return $this->hasMany(Box::class)
			->orderBy('number');
	}
}