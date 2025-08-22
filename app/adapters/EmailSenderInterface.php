<?php
namespace app\adapters;

use app\models\Mail;

interface EmailSenderInterface {
	public function send(Mail $mail);
}