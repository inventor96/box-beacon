<?php

namespace app\http\controllers;

use mako\http\routing\Controller;
use mako\view\ViewFactory;

class Index extends Controller
{
	/**
	 * Home page action.
	 */
	public function home(ViewFactory $view): string
	{
		return $view->render('Pages/Home');
	}
}
