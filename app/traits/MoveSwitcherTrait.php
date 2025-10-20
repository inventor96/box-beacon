<?php
namespace app\traits;

use app\models\Move;
use mako\http\response\senders\Redirect;

trait MoveSwitcherTrait {
	/**
	 * Check if the target move exists.
	 * If it doesn't exist, redirect to the first move.
	 * If no move is available, prompt the user to create one.
	 *
	 * @param Move $move The instance of `Move` to query with.
	 * @param integer $move_id The ID of the move to check.
	 * @param Move|null $m The move instance (if found).
	 * @param string|null $object_name The name of the object being managed. Defaults to the lowercase form of the current class.
	 * @param string|null $route The route to redirect to (if needed). Defaults to `<object_name>:home`.
	 * @return Redirect|null A redirect response if the move is invalid, or `null` if the move is valid.
	 */
	protected function checkMove(Move $move, int $move_id, ?Move &$m = null, ?string $object_name = null, ?string $route = null): Redirect|null {
		// ensure the move_id is invalid (e.g. someone deleted it)
		$m = $move->getInstance($move_id);
		if ($m === null) {
			$m = $this->getUser()->moves()->first();

			// default to the lowercase form of the current class
			if ($object_name === null) {
				$object_name = strtolower((new \ReflectionClass($this))->getShortName());
			}

			// if they don't have any moves, redirect them to the moves page
			if ($m === null) {
				$this->session->putFlash('warning', 'Please create a move before managing ' . $object_name . '.');
				return $this->safeRedirectResponse('moves:home');
			}

			// redirect to active move, or first move
			return $this->safeRedirectResponse($route ?? $object_name . ':home', ['move_id' => $this->getUser()->active_move_id ?? $m->id]);
		}

		$this->authorize('view', $m);

		return null;
	}
}