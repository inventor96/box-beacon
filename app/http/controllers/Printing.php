<?php
namespace app\http\controllers;

use app\models\Box;

class Printing extends ControllerBase
{
	public function print(Box $box, string $ids)
	{
		// ensure each box is valid
		$ids = explode(',', $ids);
		$boxes = array_map(fn($id) => $box->getInstanceOrThrow($id, ['id', 'number', 'move_id']), $ids);
		foreach ($boxes as $b) {
			$this->authorize('view', $b);
		}

		return $this->view->render('Pages/Printing/Print', [
			'boxes' => $boxes,
		]);
	}
}