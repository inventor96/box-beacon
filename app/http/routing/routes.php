<?php

use app\http\controllers\Account;
use app\http\controllers\Auth;
use app\http\controllers\Boxes;
use app\http\controllers\Dashboard;
use app\http\controllers\Moves;
use app\http\controllers\Printing;
use app\http\controllers\Rooms;

/** @var \mako\http\routing\Routes $routes */
/** @var \mako\application\Application $app */
/** @var \mako\syringe\Container $container */

#region dashboard
$routes->get('/', [Dashboard::class, 'home'], 'dashboard:home');
#endregion

#region authentication
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
#endregion

#region account
$routes->get('/account', [Account::class, 'home'], 'account:home');
$routes->put('/account', [Account::class, 'update'], 'account:update');
#endregion

#region boxes
$routes->get('/moves/{move_id}/boxes', [Boxes::class, 'home'], 'boxes:home');
$routes->post('/moves/{move_id}/boxes/new', [Boxes::class, 'newAction'], 'boxes:newAction');
$routes->get('/moves/{move_id}/boxes/{id}', [Boxes::class, 'edit'], 'boxes:edit');
$routes->post('/moves/{move_id}/boxes/{id}', [Boxes::class, 'editAction'], 'boxes:editAction');
$routes->delete('/moves/{move_id}/boxes/{id}', [Boxes::class, 'deleteAction'], 'boxes:deleteAction');
#endregion

#region print
$routes->get('/print/{ids}', [Printing::class, 'print'], 'printing:print')
	->patterns([
		'size' => '[1-6]',
		'ids' => '\d+(?:,\d+)*'
	]);
#endregion

#region moves
$routes->get('/moves', [Moves::class, 'home'], 'moves:home');
$routes->post('/moves/{id}/set-active', [Moves::class, 'setActive'], 'moves:setActive');
$routes->get('/moves/{id}', [Moves::class, 'edit'], 'moves:edit');
$routes->post('/moves/{id}', [Moves::class, 'editAction'], 'moves:editAction');
$routes->delete('/moves/{id}', [Moves::class, 'deleteAction'], 'moves:deleteAction');
$routes->get('/moves/{id}/users/new', [Moves::class, 'addUser'], 'moves:addUser');
$routes->post('/moves/{id}/users/new', [Moves::class, 'addUserAction'], 'moves:addUserAction');
$routes->delete('/moves/{move_id}/users/{user_id}', [Moves::class, 'deleteUser'], 'moves:deleteUser');
$routes->delete('/moves/{move_id}/invites/{invite_id}', [Moves::class, 'deleteInviteAction'], 'moves:deleteInviteAction');
#endregion

#region rooms
$routes->get('/moves/{move_id}/rooms', [Rooms::class, 'home'], 'rooms:home');
$routes->get('/moves/{move_id}/rooms/{id}', [Rooms::class, 'edit'], 'rooms:edit');
$routes->post('/moves/{move_id}/rooms/{id}', [Rooms::class, 'editAction'], 'rooms:editAction');
$routes->delete('/moves/{move_id}/rooms/{id}', [Rooms::class, 'deleteAction'], 'rooms:deleteAction');
#endregion
