<?php
namespace app\http\controllers;

use app\http\routing\middleware\Throttle;
use app\models\User;
use mako\gatekeeper\Gatekeeper;
use mako\http\routing\attributes\Middleware;

class Auth extends ControllerBase
{
	/**
	 * Override the default authentication required.
	 */
	public function beforeAction() {
		return;
	}

	/**
	 * Render login page.
	 */
	public function login() {
		// no need to be here if they're already logged in
		if ($this->gatekeeper->isLoggedIn()) {
			return $this->redirectResponse('dashboard:home');
		}
		return $this->view->render('Pages/Auth/Login');
	}

	#[Middleware(Throttle::class)]
	public function loginAction() {
		// no need to be here if they're already logged in
		if ($this->gatekeeper->isLoggedIn()) {
			return $this->redirectResponse('dashboard:home');
		}

		// validate values
		$post = $this->getValidatedInput([
			'email' => ['required'],
			'password' => ['required'],
			'remember' => ['required', 'in(["1", "0"])'],
		]);

		// attempt the login
		$result = $this->gatekeeper->login($post['email'], $post['password'], !!$post['remember']);
		if ($result === true) {
			return $this->redirectResponse('dashboard:home');
		} else {
			$this->session->putFlash('error', match ($result) {
				Gatekeeper::LOGIN_INCORRECT => "We don't recognize that email or password. Please try again.",
				Gatekeeper::LOGIN_ACTIVATING => 'Your account has not been activated. Please check your email for the activation link.',
				Gatekeeper::LOGIN_BANNED => 'Your account has been banned. Please contact support.',
				Gatekeeper::LOGIN_LOCKED => 'You have made too many failed login attempts. Please wait a while before trying again.',
				default => "There was an error logging you in. Please try again later.",
			});
			return $this->redirectResponse('auth:login');
		}
	}

	/**
	 * Logout action.
	 */
	public function logout() {
		$this->gatekeeper->logout();
		return $this->redirectResponse('auth:login');
	}

	public function signup() {
		// no need to be here if they're already logged in
		if ($this->gatekeeper->isLoggedIn()) {
			return $this->redirectResponse('dashboard:home');
		}
		return $this->view->render('Pages/Auth/Signup');
	}

	public function signupAction(User $user) {
		// no need to be here if they're already logged in
		if ($this->gatekeeper->isLoggedIn()) {
			return $this->redirectResponse('dashboard:home');
		}

		// validate values
		$post = $this->getValidatedInput([
			'first_name' => ['required'],
			'last_name' => ['required'],
			'email' => ['required', 'email'],
			'password' => ['required', 'min_length(8)'],
			'confirm_password' => ['required', 'match("password")'],
		]);

		// attempt the signup
		$user->createOrUpdateFrom($post, $this->gatekeeper);
		$this->session->putFlash('success', 'Your account has been created successfully. You can now log in.');
		return $this->redirectResponse('auth:login');
	}
}