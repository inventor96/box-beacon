<?php
namespace app\http\controllers;

use app\models\Move;
use app\models\User;

class Moves extends ControllerBase
{
	public function home()
	{
		$moves = $this->getUser()->moves()->all();
		return $this->view->render('Pages/Moves/Home', [
			'moves' => $moves,
			'active_move_id' => $this->getUser()->active_move_id,
		]);
	}

	public function setActive(Move $move, int $id)
	{
		$m = $move->getInstanceOrThrow($id);
		$this->authorize('view', $m);
		$this->getUser()->active_move_id = $id;
		$this->getUser()->save();
		$this->session->putFlash('success', $m->name . ' is now your current move.');
		return $this->redirectSamePage('moves:home');
	}

	public function unload(Move $move, int $id)
	{
		$m = $move->getInstanceOrThrow($id);
		$this->authorize('view', $m);
		return $this->view->render('Pages/Moves/Unload', [
			'move' => $m,
		]);
	}

	public function edit(Move $move, int|string $id)
	{
		$m = $id === 'new'
			? null
			: $move->where('id', '=', $id)
				->including([
					'users',
					'moveInvites' => fn($query) => $query->where('accepted', '=', false)
				])->firstOrThrow();
		if ($m !== null) {
			$this->authorize('edit', $m);
		}
		return $this->view->render('Pages/Moves/Edit', [
			'move' => $m,
			'user' => $this->getUser(),
		]);
	}

	public function editAction(Move $move, int|string $id)
	{
		$post = $this->getValidatedInput($move->getValidatorSpec());
		if ($id === 'new') {
			$record = $move->requireAndAssign($post);
			$record->save();
			$this->getUser()->moves()->link($record);
			$this->session->putFlash('success', 'Move created successfully.');
		} else {
			$m = $move->getInstanceOrThrow($id);
			$this->authorize('edit', $m);
			$record = $m->requireAndAssign($post);
			$record->save();
			$this->session->putFlash('success', 'Move updated successfully.');
		}
		return $this->safeRedirectResponse('moves:home');
	}

	public function deleteAction(Move $move, int $id)
	{
		$m = $move->getInstanceOrThrow($id);
		$this->authorize('delete', $m);
		$m->delete();
		$this->session->putFlash('success', 'Move deleted successfully.');
		return $this->safeRedirectResponse('moves:home');
	}

	public function deleteUser(User $user, Move $move, int $move_id, int $user_id)
	{
		$u = $user->getInstanceOrThrow($user_id);
		$m = $move->getInstanceOrThrow($move_id);
		$this->authorize('edit', $m);
		$m->users()->unlink($u);
		$this->session->putFlash('success', 'Participant removed successfully.');
		return $this->safeRedirectResponse('moves:edit', ['id' => $move_id]);
	}
}