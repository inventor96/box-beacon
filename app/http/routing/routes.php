<?php

use app\http\controllers\Account;
use app\http\controllers\Auth;
use app\http\controllers\Boxes;
use app\http\controllers\Dashboard;
use app\http\controllers\Moves;

/** @var \mako\http\routing\Routes $routes */
/** @var \mako\application\Application $app */
/** @var \mako\syringe\Container $container */

// dashboard
$routes->get('/', [Dashboard::class, 'home'], 'dashboard:home');

// authentication
$routes->get('/login', [Auth::class, 'login'], 'auth:login');
$routes->post('/login', [Auth::class, 'loginAction'], 'auth:loginAction');
$routes->get('/logout', [Auth::class, 'logout'], 'auth:logout');
$routes->get('/signup', [Auth::class, 'signup'], 'auth:signup');
$routes->post('/signup', [Auth::class, 'signupAction'], 'auth:signupAction');
$routes->get('/activate/{token}', [Auth::class, 'activate'], 'auth:activate');
$routes->get('/forgot', [Auth::class, 'forgotPassword'], 'auth:forgotPassword');
$routes->post('/forgot', [Auth::class, 'forgotPasswordAction'], 'auth:forgotPasswordAction');
$routes->get('/reset/{token}', [Auth::class, 'resetPassword'], 'auth:resetPassword');
$routes->post('/reset/{token}', [Auth::class, 'resetPasswordAction'], 'auth:resetPasswordAction');

// account
$routes->get('/account', [Account::class, 'home'], 'account:home');
$routes->put('/account', [Account::class, 'update'], 'account:update');

// boxes
$routes->get('/boxes', [Boxes::class, 'home'], 'boxes:home');
$routes->get('/boxes/{id}', [Boxes::class, 'view'], 'boxes:view');
$routes->post('/boxes', [Boxes::class, 'create'], 'boxes:create');
$routes->put('/boxes/{id}', [Boxes::class, 'update'], 'boxes:update');
$routes->delete('/boxes/{id}', [Boxes::class, 'delete'], 'boxes:delete');

// moves
$routes->get('/moves', [Moves::class, 'home'], 'moves:home');
$routes->get('/moves/{id}', [Moves::class, 'view'], 'moves:view');
$routes->post('/moves/{id}', [Moves::class, 'updateAction'], 'moves:updateAction');
$routes->delete('/moves/{id}', [Moves::class, 'deleteAction'], 'moves:deleteAction');
$routes->get('/moves/{id}/add-user', [Moves::class, 'addUser'], 'moves:addUser');
$routes->post('/moves/{id}/add-user', [Moves::class, 'addUserAction'], 'moves:addUserAction');
