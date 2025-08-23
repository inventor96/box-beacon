<?php
namespace app\http\controllers;

use app\models\Move;

class Boxes extends ControllerBase
{
	public function home(Move $move, int $move_id)
	{
		// ensure the move_id is invalid (e.g. someone deleted it)
		$m = $move->getInstance($move_id);
		if ($m === null) {
			$m = $this->getUser()->moves()->first();

			// if they don't have any moves, redirect them to the moves page
			if ($m === null) {
				$this->session->putFlash('warning', 'Please create a move before managing boxes.');
				return $this->safeRedirectResponse('moves:home');
			}

			// redirect to active move, or first move
			return $this->safeRedirectResponse('boxes:home', ['move_id' => $this->getUser()->active_move_id ?? $m->id]);
		}

		// render the page
		return $this->view->render('Pages/Boxes/Home', [
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'boxes' => [],
		]);
	}
}