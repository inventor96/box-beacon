<?php
namespace app\models;

use app\interfaces\ValidatorSpecInterface;
use app\traits\AssignRequireTrait;
use app\traits\AutoIdRelationTrait;
use app\traits\OrmInstanceGetTrait;
use mako\chrono\Time;
use mako\database\midgard\ORM;
use mako\database\midgard\ResultSet;
use mako\database\midgard\traits\NullableTrait;
use mako\database\midgard\traits\TimestampedTrait;

/**
 * @property int $id
 * @property Move $move
 * @property-read int $number
 * @property Room $fromRoom
 * @property Room $toRoom
 * @property Item[]|ResultSet $items
 * @property Tag[]|ResultSet $tags
 * @property Time $created_at
 * @property Time $updated_at
 */
class Box extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;
	use NullableTrait;

	protected array $cast = [
	];

	protected array $assignable = [
		'from_room_id',
		'to_room_id',
	];

	protected array $required_fields = [
	];

	protected array $nullable = [
		'from_room_id',
		'to_room_id',
	];

	public function getValidatorSpec(): array
	{
		return [
			//'number' => ['required', 'integer'],
			'from_room_id' => ['optional', 'exists("rooms", "id")'],
			'to_room_id' => ['optional', 'exists("rooms", "id")'],
		];
	}

	protected function getNextBoxNumber(): int
	{
		// Get the highest box number for the current move
		$highest = $this
			->where('move_id', '=', $this->move_id)
			->orderBy('number', 'desc')
			->column('number');

		return $highest ? $highest + 1 : 1;
	}

	public function save(): bool
	{
		// set a box number for new boxes
		if (!$this->isPersisted()) {
			$this->number = $this->getNextBoxNumber();
		}
		return parent::save();
	}

	public function move()
	{
		return $this->belongsTo(Move::class);
	}

	public function fromRoom()
	{
		return $this->belongsTo(Room::class, 'from_room_id');
	}

	public function toRoom()
	{
		return $this->belongsTo(Room::class, 'to_room_id');
	}

	public function items()
	{
		return $this->hasMany(Item::class);
	}

	public function tags()
	{
		return $this->manyToMany(Tag::class);
	}
}