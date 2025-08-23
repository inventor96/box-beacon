<?php
namespace app\http\controllers;

use app\models\Move;

class Moves extends ControllerBase
{
	public function home(Move $move)
	{
		$moves = $this->getUser()->moves()->all();
		return $this->view->render('Pages/Moves/Home', [
			'moves' => $moves,
		]);
	}

	public function view(Move $move, int|string $id)
	{
		return $this->view->render('Pages/Moves/Edit', [
			'move' => $id === 'new' ? null : $move->getInstanceOrThrow($id)->including('users')->first()->toArray(),
			'user' => $this->getUser(),
		]);
	}

	public function updateAction(Move $move, int|string $id)
	{
		$post = $this->getValidatedInput($move->getValidatorSpec());
		if ($id === 'new') {
			$record = $move->requireAndAssign($post);
			$record->save();
			$this->getUser()->moves()->link($record);
			$this->session->putFlash('success', 'Move created successfully.');
		} else {
			$record = $move->getInstanceOrThrow($id)->requireAndAssign($post);
			$record->save();
			$this->session->putFlash('success', 'Move updated successfully.');
		}
		return $this->safeRedirectResponse('moves:home');
	}

	public function deleteAction(Move $move, int|string $id)
	{
		$move->getInstanceOrThrow($id)->delete();
		$this->session->putFlash('success', 'Move deleted successfully.');
		return $this->safeRedirectResponse('moves:home');
	}
}