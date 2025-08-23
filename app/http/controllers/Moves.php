<?php
namespace app\http\controllers;

use app\models\Move;
use app\models\MoveInvite;
use mako\gatekeeper\repositories\user\UserRepository;

class Moves extends ControllerBase
{
	public function home(Move $move)
	{
		$moves = $this->getUser()->moves()->all();
		return $this->view->render('Pages/Moves/Home', [
			'moves' => $moves,
		]);
	}

	public function edit(Move $move, int|string $id)
	{
		return $this->view->render('Pages/Moves/Edit', [
			'move' => $id === 'new' ? null : $move->getInstanceOrThrow($id)->including(['users', 'moveInvites'])->first(),
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
			$record = $move->getInstanceOrThrow($id)->requireAndAssign($post);
			$record->save();
			$this->session->putFlash('success', 'Move updated successfully.');
		}
		return $this->safeRedirectResponse('moves:home');
	}

	public function deleteAction(Move $move, int $id)
	{
		$move->getInstanceOrThrow($id)->delete();
		$this->session->putFlash('success', 'Move deleted successfully.');
		return $this->safeRedirectResponse('moves:home');
	}

	public function addUser(Move $move, int $id)
	{
		return $this->view->render('Pages/Moves/AddUser', [
			'move' => $move->getInstanceOrThrow($id),
		]);
	}

	public function addUserAction(Move $move, MoveInvite $invite, int $id)
	{
		$post = $this->getValidatedInput(['email' => ['required', 'email']]);
		$move = $move->getInstanceOrThrow($id);

		// check for existing user
		/** @var UserRepository */
		$repo = $this->gatekeeper->getUserRepository();
		/** @var ?User */
		$user = $repo->getByEmail($post['email']);

		if ($user) {
			// check if user is already a participant
			if ($move->users()->where('id', '=', $user->id)->count()) {
				$this->session->putFlash('warning', $post['email'] . ' is already a participant.');
				return $this->safeRedirectResponse('moves:addUser', ['id' => $id]);
			}

			// link existing user
			$move->users()->link($user);

			// back to move view
			$this->session->putFlash('success', 'Participant added successfully!');
			return $this->safeRedirectResponse('moves:edit', ['id' => $id]);
		} else {
			// invite new user to move
			$invite->requireAndAssign($post);
			$move->moveInvites()->create($invite);

			// back to move view
			$this->session->putFlash('success', $post['email'] . ' has been invited to the move.');
			return $this->safeRedirectResponse('moves:edit', ['id' => $id]);
		}
	}

	public function deleteInviteAction(MoveInvite $invite, int $move_id, int $invite_id)
	{
		$invite = $invite->getInstanceOrThrow($invite_id);
		$invite->delete();
		$this->session->putFlash('success', 'Invitation deleted successfully.');
		return $this->safeRedirectResponse('moves:edit', ['id' => $move_id]);
	}
}