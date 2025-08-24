<?php
namespace app\http\controllers;

use app\models\Box;
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
			'active_move_id' => $this->getUser()->active_move_id,
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'boxes' => $m->boxes()->all(),
		]);
	}

	public function edit(Move $move, Box $box, int $move_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		return $this->view->render('Pages/Boxes/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'box' => $id === 'new' ? null : $box->getInstanceOrThrow($id),
		]);
	}

	public function editAction(Move $move, Box $box, int $move_id, int|string $id)
	{
		$post = $this->getValidatedInput($box->getValidatorSpec());
		if ($id === 'new') {
			$box->requireAndAssign($post);
			$m = $move->getInstanceOrThrow($move_id);
			$b = $m->boxes()->create($box);
			$this->session->putFlash('success', 'Box added successfully.');
			return $this->safeRedirectResponse('boxes:edit', ['move_id' => $move_id, 'id' => $b->id]);
		} else {
			$record = $box->getInstanceOrThrow($id)->requireAndAssign($post);
			$record->save();
			$this->session->putFlash('success', 'Box updated successfully.');
			return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
		}
	}

	public function deleteAction(Move $move, Box $box, int $move_id, int $id)
	{
		$box->getInstanceOrThrow($id)->delete();
		$this->session->putFlash('success', 'Box deleted successfully.');
		return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
	}
}