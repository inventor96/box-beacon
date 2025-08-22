<?php

use app\http\controllers\Auth;
use app\http\controllers\Dashboard;

/** @var \mako\http\routing\Routes $routes */
/** @var \mako\application\Application $app */
/** @var \mako\syringe\Container $container */

$routes->get('/', [Dashboard::class, 'home'], 'dashboard:home');

$routes->get('/login', [Auth::class, 'login'], 'auth:login');
$routes->post('/login', [Auth::class, 'loginAction'], 'auth:loginAction');
$routes->get('/logout', [Auth::class, 'logout'], 'auth:logout');
$routes->get('/signup', [Auth::class, 'signup'], 'auth:signup');
$routes->post('/signup', [Auth::class, 'signupAction'], 'auth:signupAction');
