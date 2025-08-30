<?php
namespace app\http\controllers;

use app\http\routing\middleware\Throttle;
use app\models\Email;
use app\models\EmailUser;
use app\models\Move;
use app\models\MoveInvite;
use mako\http\routing\attributes\Middleware;

class Invites extends ControllerBase
{
	public function newAction(MoveInvite $invite, Move $move, Email $email)
	{
		// validate input
		$post = $this->getValidatedInput($invite->getValidatorSpec() + ['move_id' => ['required', 'numeric:int']]);
		$move = $move->getInstanceOrThrow($post['move_id']);
		$this->authorize('edit', $move);

		// create invite
		$invite->requireAndAssign($post);
		/** @var MoveInvite $i */
		$i = $move->moveInvites()->create($invite);

		// send email
		$user = $this->getUser();
		$email->sendTemplate([new EmailUser($post['email'])], '[Box Beacon] Move Invitation', 'move-invitation', [
			'sender_name' => $user->first_name . ' ' . $user->last_name,
			'move_name' => $move->name,
			'token' => $i->token,
		]);

		// back to move view
		$this->session->putFlash('success', $post['email'] . ' has been invited to the move.');
		return $this->redirectSamePage('moves:edit', ['id' => $move->id]);
	}

	public function deleteAction(MoveInvite $invite, int $id)
	{
		$i = $invite->getInstanceOrThrow($id);
		$this->authorize('delete', $i);
		$i->delete();
		$this->session->putFlash('success', 'Invite deleted.');
		return $this->redirectSamePage('moves:edit', ['id' => $i->move_id]);
	}

	#[Middleware(Throttle::class)]
	public function accept(MoveInvite $invite, Move $move, string $token)
	{
		// check if invite and move exist
		$i = $invite->getByToken($token);
		$m = $move->getInstance($i?->move_id ?? 0);
		if ($i === null || $m === null) {
			$this->session->putFlash('error', 'That\'s not a valid invite link. It may have already been used, deleted, or the move may no longer exist.');
			return $this->safeRedirectResponse('dashboard:home');
		}

		// check if user is logged in
		$user = $this->getUser();
		if ($user === null) {
			$this->session->putFlash('error', 'Please log in or sign up to accept this invite.');
			$this->session->put('_auth_redirect_', $this->urlBuilder->current()); // store the current URL to redirect back after login
			return $this->safeRedirectResponse('auth:login');
		}

		// process invite
		$m->users()->link($user);
		$i->accepted = true;
		$i->save();

		// go to list of moves
		$this->session->putFlash('success', 'Invite accepted! You can now find the "' . $m->name . '" move in your account.');
		return $this->safeRedirectResponse('moves:home');
	}
}