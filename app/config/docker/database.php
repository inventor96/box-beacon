<?php

use function mako\env;

return (function() {
	$database = require(__DIR__.'/../database.php');
	$database['configurations']['boxbeacon']['dsn'] = 'mysql:dbname=' . env('MYSQL_DATABASE') . ';host=db;port=3306';
	$database['configurations']['boxbeacon']['username'] = env('MYSQL_USER');
	$database['configurations']['boxbeacon']['password'] = env('MYSQL_PASSWORD');
	$database['configurations']['boxbeacon']['log_queries'] = true;
	return $database;
})();