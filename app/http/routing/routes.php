<?php

use app\http\controllers\Account;
use app\http\controllers\Auth;
use app\http\controllers\Boxes;
use app\http\controllers\Dashboard;
use app\http\controllers\Fonts;
use app\http\controllers\Invites;
use app\http\controllers\Items;
use app\http\controllers\Moves;
use app\http\controllers\Printing;
use app\http\controllers\Rooms;
use app\http\controllers\Tags;
use app\http\routing\middleware\RequireAuth;
use mako\http\routing\Routes;

/** @var \mako\http\routing\Routes $routes */
/** @var \mako\application\Application $app */
/** @var \mako\syringe\Container $container */

$routes->group([
	'patterns' => [
		'id' => '\d+',
		'move_id' => '\d+',
		'box_id' => '\d+',
		'item_id' => '\d+',
		'user_id' => '\d+',
	],
], function (Routes $routes) {
	// no auth requirement
	$routes->group([
		'middleware' => [
			[RequireAuth::class, ['require' => false]],
		],
	], function (Routes $routes) {
		$routes->get('/assets/fonts/{font}', [Fonts::class, 'fonts'], 'fonts:fonts');

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

		$routes->get('/invite/{token}', [Invites::class, 'accept'], 'invites:accept');
	});
	
	#region dashboard
	$routes->get('/', [Dashboard::class, 'home'], 'dashboard:home');
	#endregion
	
	#region account
	$routes->get('/account', [Account::class, 'home'], 'account:home');
	$routes->put('/account', [Account::class, 'updateAction'], 'account:updateAction');
	$routes->post('/account/password', [Account::class, 'updatePasswordAction'], 'account:updatePasswordAction');
	$routes->delete('/account', [Account::class, 'deleteAction'], 'account:deleteAction');
	#endregion

	#region invites
	$routes->post('/invites/new', [Invites::class, 'newAction'], 'invites:newAction');
	$routes->delete('/invites/{id}', [Invites::class, 'deleteAction'], 'invites:deleteAction');
	#endregion
	
	#region boxes
	$routes->get('/moves/{move_id}/boxes', [Boxes::class, 'home'], 'boxes:home');
	$routes->post('/moves/{move_id}/boxes/new', [Boxes::class, 'newAction'], 'boxes:newAction');
	$routes->post('/moves/{move_id}/boxes/batch', [Boxes::class, 'batchAction'], 'boxes:batchAction');
	$routes->get('/moves/{move_id}/boxes/{id}', [Boxes::class, 'edit'], 'boxes:edit');
	$routes->post('/moves/{move_id}/boxes/{id}', [Boxes::class, 'editAction'], 'boxes:editAction');
	$routes->delete('/moves/{move_id}/boxes/{id}', [Boxes::class, 'deleteAction'], 'boxes:deleteAction');
	$routes->get('/moves/{move_id}/boxes/{id}/unload', [Boxes::class, 'unloadDetails'], 'boxes:unloadDetails');
	$routes->get('/moves/{move_id}/box-by-number/{number}/unload', [Boxes::class, 'unloadDetailsByNumber'], 'boxes:unloadDetailsByNumber')
		->patterns([
			'number' => '\d+'
		]);
	#endregion
	
	#region items
	$routes->get('/moves/{move_id}/items', [Items::class, 'home'], 'items:home');
	$routes->post('/moves/{move_id}/boxes/{box_id}/items/new', [Items::class, 'newAction'], 'items:newAction');
	$routes->get('/moves/{move_id}/boxes/{box_id}/items/{id}', [Items::class, 'edit'], 'items:edit');
	$routes->post('/moves/{move_id}/boxes/{box_id}/items/{id}', [Items::class, 'editAction'], 'items:editAction');
	$routes->delete('/moves/{move_id}/boxes/{box_id}/items/{id}', [Items::class, 'deleteAction'], 'items:deleteAction');
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
	$routes->get('/moves/{id}/unload', [Moves::class, 'unload'], 'moves:unload');
	$routes->get('/moves/{id}', [Moves::class, 'edit'], 'moves:edit')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->post('/moves/{id}', [Moves::class, 'editAction'], 'moves:editAction')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->delete('/moves/{id}', [Moves::class, 'deleteAction'], 'moves:deleteAction');
	$routes->delete('/moves/{move_id}/users/{user_id}', [Moves::class, 'deleteUser'], 'moves:deleteUser');
	#endregion
	
	#region rooms
	$routes->get('/moves/{move_id}/rooms', [Rooms::class, 'home'], 'rooms:home');
	$routes->get('/moves/{move_id}/rooms/{id}', [Rooms::class, 'edit'], 'rooms:edit')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->post('/moves/{move_id}/rooms/{id}', [Rooms::class, 'editAction'], 'rooms:editAction')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->delete('/moves/{move_id}/rooms/{id}', [Rooms::class, 'deleteAction'], 'rooms:deleteAction');
	#endregion

	#region tags
	$routes->get('/moves/{move_id}/tags', [Tags::class, 'home'], 'tags:home');
	$routes->get('/moves/{move_id}/tags/{id}', [Tags::class, 'edit'], 'tags:edit')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->post('/moves/{move_id}/tags/{id}', [Tags::class, 'editAction'], 'tags:editAction')
		->patterns([
			'id' => '\d+|new'
		]);
	$routes->delete('/moves/{move_id}/tags/{id}', [Tags::class, 'deleteAction'], 'tags:deleteAction');
	#endregion
});
