<?php
namespace app\models;

use mako\database\midgard\ORM;
use mako\database\midgard\traits\TimestampedTrait;

/**
 * @property int $id
 * @property Move $move
 * @property-read int $number
 * @property bool $heavy
 * @property bool $fragile
 * @property Time $created_at
 * @property Time $updated_at
 */
class Box extends ORM implements ValidatorSpecInterface
{
	use AutoIdRelationTrait;
	use AssignRequireTrait;
	use OrmInstanceGetTrait;
	use TimestampedTrait;

	protected array $cast = [
		'heavy' => 'bool',
		'fragile' => 'bool',
		'created_at' => 'date',
		'updated_at' => 'date',
	];

	protected array $assignable = [
		'heavy',
		'fragile',
	];

	protected array $required_fields = [
	];

	public function getValidatorSpec(): array
	{
		return [
			//'number' => ['required', 'integer'],
			'heavy' => ['required', 'boolean'],
			'fragile' => ['required', 'boolean'],
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
}