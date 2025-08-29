<?php
namespace app\models;

use app\interfaces\ValidatorSpecInterface;
use app\traits\AssignRequireTrait;
use app\traits\AutoIdRelationTrait;
use app\traits\OrmInstanceGetTrait;
use mako\chrono\Time;
use mako\database\midgard\ORM;
use mako\database\midgard\traits\TimestampedTrait;
use mako\http\exceptions\NotFoundException;

/**
 * @property int $id
 * @property Move $move
 * @property string $email
 * @property string $token
 * @property bool $accepted
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
		'accepted' => 'bool',
	];

	protected array $assignable = [
		'email',
		'accepted',
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

	public function save(): bool
	{
		if (!$this->isPersisted()) {
			$this->token = bin2hex(random_bytes(32)); // 64 character token
		}
		return parent::save();
	}

	public function getByToken(string $token, bool $only_unaccepted = true): ?self
	{
		$query = $this->where('token', '=', $token);
		if ($only_unaccepted) {
			$query->where('accepted', '=', false);
		}
		return $query->first();
	}

	public function getByTokenOrThrow(string $token, bool $only_unaccepted = true): ?self
	{
		$query = $this->where('token', '=', $token);
		if ($only_unaccepted) {
			$query->where('accepted', '=', false);
		}
		return $query->firstOrThrow(NotFoundException::class);
	}
}