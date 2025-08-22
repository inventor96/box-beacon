<?php

namespace app\http\controllers;

use mako\view\ViewFactory;

class Dashboard extends ControllerBase
{
	/**
	 * Home page action.
	 */
	public function home(): string
	{
		return $this->view->render('Pages/Dashboard/Home');
	}
}
