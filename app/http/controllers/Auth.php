<?php
namespace app\http\controllers;

use app\http\routing\middleware\Throttle;
use mako\http\routing\attributes\Middleware;
use mako\validator\exceptions\ValidationException;

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
			//throw new ValidationException(["We don't recognize that email or password. Please try again."]);
			$this->session->putFlash('error', "We don't recognize that email or password. Please try again.");
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
}