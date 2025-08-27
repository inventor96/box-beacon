<?php
namespace app\http\controllers;

use app\models\Box;
use app\models\Item;
use app\models\Move;
use app\traits\MoveSwitcherTrait;

class Boxes extends ControllerBase
{
	use MoveSwitcherTrait;

	public function home(Move $move, int $move_id)
	{
		if ($r = $this->checkMove($move, $move_id, $m)) return $r;

		// render the page
		return $this->view->render('Pages/Boxes/Home', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'boxes' => $m->boxes()->including(['fromRoom', 'toRoom', 'items'])->all(),
		]);
	}

	public function newAction(Move $move, Box $box, int $move_id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$b = $m->boxes()->create($box);
		return $this->safeRedirectResponse('boxes:edit', ['move_id' => $move_id, 'id' => $b->id]);
	}

	public function batchAction(Move $move, Box $box, int $move_id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$post = $this->getValidatedInput([
			'pages' => ['numeric:int', 'between(1,20)']
		]);
		$boxes = [];
		$box_count = (int)$post['pages'] * 6;
		for ($i = 0; $i < $box_count; $i++) {
			$boxes[] = $m->boxes()->create(clone $box);
		}
		$box_ids = array_map(fn($b) => $b->id, $boxes);
		return $this->safeRedirectResponse('printing:print', ['ids' => implode(',', $box_ids)]);
	}

	public function edit(Move $move, Box $box, int $move_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		return $this->view->render('Pages/Boxes/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'rooms' => $m->rooms()->all(),
			'box' => $id === 'new' ? null : $box->where('id', '=', $id)->including(['items'])->first(),
		]);
	}

	public function editAction(Move $move, Box $box, Item $item, int $move_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);

		// add item rules
		$item_rules = [];
		foreach ($item->getValidatorSpec() as $field => $rules) {
			$item_rules["items.*.$field"] = $rules;
		}
		$post = $this->getValidatedInput([
			...$box->getValidatorSpec(),
			...$item_rules,
		]);

		// create or save box details
		if ($id === 'new') {
			$box->requireAndAssign($post);
			$b = $m->boxes()->create($box);
			$this->assignItems($item, $post['items'] ?? []);
			$this->session->putFlash('success', 'Box added successfully.');
			return $this->safeRedirectResponse('boxes:edit', ['move_id' => $move_id, 'id' => $b->id]);
		} else {
			$record = $box->getInstanceOrThrow($id)->requireAndAssign($post);
			$record->save();
			$this->assignItems($item, $post['items'] ?? []);
			$this->session->putFlash('success', 'Box updated successfully.');
			return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
		}
	}

	protected function assignItems(Item $item, array $items): void
	{
		foreach ($items as $id => $post) {
			$item->getInstanceOrThrow($id)->requireAndAssign($post)->save();
		}
	}

	public function deleteAction(Move $move, Box $box, int $move_id, int $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$box->getInstanceOrThrow($id)->delete();
		$this->session->putFlash('success', 'Box deleted successfully.');
		return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
	}
}