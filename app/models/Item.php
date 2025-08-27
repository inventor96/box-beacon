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
 * @property Box $box
 * @property Time $created_at
 * @property Time $updated_at
 */
class Item extends ORM implements ValidatorSpecInterface
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
	];

	public function getValidatorSpec(): array
	{
		return [
			'name' => ['optional', 'string', 'max_length(255)'],
		];
	}

	public function box()
	{
		return $this->belongsTo(Box::class);
	}
}