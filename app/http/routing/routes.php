<?php

use app\http\controllers\Dashboard;

/** @var \mako\http\routing\Routes $routes */
/** @var \mako\application\Application $app */
/** @var \mako\syringe\Container $container */
$routes->get('/', [Dashboard::class, 'home'], 'dashboard:home');
