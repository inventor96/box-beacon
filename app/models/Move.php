<?php
namespace app\models;

use app\enums\RoomLocation;
use app\interfaces\ValidatorSpecInterface;
use app\traits\AssignRequireTrait;
use app\traits\AutoIdRelationTrait;
use app\traits\OrmInstanceGetTrait;
use mako\chrono\Time;
use mako\database\midgard\ORM;
use mako\database\midgard\ResultSet;
use mako\database\midgard\traits\TimestampedTrait;

/**
 * @property int $id
 * @property string $name
 * @property User $user
 * @property MoveInvite[]|ResultSet $moveInvites
 * @property Box[]|ResultSet $boxes
 * @property Room[]|ResultSet $rooms
 * @property Room[]|ResultSet $fromRooms
 * @property Room[]|ResultSet $toRooms
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
		return $this->manyToMany(User::class)
			->orderBy('first_name');
	}

	public function moveInvites()
	{
		return $this->hasMany(MoveInvite::class)
			->orderBy('email');
	}

	public function boxes()
	{
		return $this->hasMany(Box::class)
			->orderBy('number');
	}

	public function rooms()
	{
		return $this->hasMany(Room::class)
			->orderBy('name');
	}

	public function fromRooms()
	{
		return $this->rooms()
			->where('location', '=', RoomLocation::FROM);
	}

	public function toRooms()
	{
		return $this->rooms()
			->where('location', '=', RoomLocation::TO);
	}
}