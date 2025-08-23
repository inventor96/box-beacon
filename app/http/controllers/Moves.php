<?php
namespace app\http\controllers;

use app\models\Move;
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

	public function addUser(Move $move, int|string $id)
	{
		return $this->view->render('Pages/Moves/AddUser', [
			'move' => $move->getInstanceOrThrow($id),
		]);
	}

	public function addUserAction(Move $move, int|string $id)
	{
		$post = $this->getValidatedInput(['email' => ['required', 'email']]);
		$move_users = $move->getInstanceOrThrow($id)->users();

		// check for existing user
		/** @var UserRepository */
		$repo = $this->gatekeeper->getUserRepository();
		/** @var ?User */
		$user = $repo->getByEmail($post['email']);

		if ($user) {
			// check if user is already a participant
			if ($move_users->where('id', '=', $user->id)->count()) {
				$this->session->putFlash('warning', $post['email'] . ' is already a participant.');
				return $this->safeRedirectResponse('moves:addUser', ['id' => $id]);
			}

			// link existing user
			$move_users->link($user);
			$this->session->putFlash('success', 'Participant added successfully!');
			return $this->safeRedirectResponse('moves:view', ['id' => $id]);
		} else {
			$this->session->putFlash('error', $post['email'] . ' does not have a Box Beacon account.');
			return $this->safeRedirectResponse('moves:addUser', ['id' => $id]);
		}
	}
}