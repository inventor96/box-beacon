<?php

use app\http\routing\middleware\AccessControl;
use inventor96\Inertia\InertiaCsrf;
use inventor96\Inertia\InertiaInputValidation;
use inventor96\Inertia\InertiaMiddleware;

/** @var \mako\http\routing\Dispatcher $dispatcher */

$dispatcher
	->registerGlobalMiddleware(InertiaCsrf::class)
	->setMiddlewarePriority(InertiaCsrf::class, 50)

	->registerGlobalMiddleware(InertiaInputValidation::class)
	->setMiddlewarePriority(InertiaInputValidation::class, 60)

	->registerGlobalMiddleware(InertiaMiddleware::class)
	->setMiddlewarePriority(InertiaMiddleware::class, 70)
;