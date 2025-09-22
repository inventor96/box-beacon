<?php
namespace app\http\controllers;

use app\models\Box;
use app\models\Item;
use app\models\Move;
use app\traits\MoveSwitcherTrait;

class Items extends ControllerBase
{
	use MoveSwitcherTrait;

	public function home(Move $move, Item $item, int $move_id)
	{
		if ($r = $this->checkMove($move, $move_id, $m)) return $r;

		return $this->view->render('Pages/Items/Home', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'items' => $item->including('box')
				->join('boxes', 'boxes.id', '=', 'items.box_id')
				->where('boxes.move_id', '=', $move_id)
				->where('items.name', '!=', '')
				->orderBy('items.name')
				->paginate(),
		]);
	}

	public function newAction(Move $move, Box $box, Item $item, int $move_id, int $box_id)
	{
		// validate access
		$m = $move->getInstanceOrThrow($move_id);
		$b = $box->getInstanceOrThrow($box_id);
		$this->authorize('edit', $b);

		// save existing items
		$item_rules = [];
		foreach ($item->getValidatorSpec() as $field => $rules) {
			$item_rules["items.*.$field"] = $rules;
		}
		$post = $this->getValidatedInput($item_rules);
		$this->assignItems($item, $post['items'] ?? []);

		// create new item
		$item->name = '';
		$i = $b->items()->create($item);

		// update page
		$this->session->putFlash('success', 'Item added successfully.');
		return $this->redirectSamePage('items:edit', ['move_id' => $move_id, 'box_id' => $box_id, 'id' => $i->id]);
	}

	protected function assignItems(Item $item, array $items): void
	{
		foreach ($items as $id => $post) {
			$i = $item->getInstanceOrThrow($id);
			$this->authorize('edit', $i);
			$i->requireAndAssign($post)->save();
		}
	}

	public function edit(Move $move, Box $box, Item $item, int $move_id, int $box_id, int $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$b = $box->getInstanceOrThrow($box_id);
		$i = $item->getInstanceOrThrow($id);
		$this->authorize('edit', $i);
		return $this->view->render('Pages/Items/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'box' => $b,
			'item' => $i,
		]);
	}

	public function editAction(Move $move, Box $box, Item $item, int $move_id, int $box_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$b = $box->getInstanceOrThrow($box_id);
		$post = $this->getValidatedInput($item->getValidatorSpec());
		if ($id === 'new') {
			$this->authorize('edit', $b);
			$item->requireAndAssign($post);
			$i = $b->items()->create($item);
			$this->session->putFlash('success', 'Item added successfully.');
			return $this->redirectSamePage('items:edit', ['move_id' => $move_id, 'box_id' => $box_id, 'id' => $i->id]);
		} else {
			$i = $item->getInstanceOrThrow($id);
			$this->authorize('edit', $i);
			$record = $i->requireAndAssign($post);
			$record->save();
			$this->session->putFlash('success', 'Item updated successfully.');
			return $this->redirectSamePage('items:home', ['move_id' => $move_id, 'box_id' => $box_id]);
		}
	}

	public function deleteAction(Move $move, Box $box, Item $item, int $move_id, int $box_id, int $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$b = $box->getInstanceOrThrow($box_id);
		$i = $item->getInstanceOrThrow($id);
		$this->authorize('delete', $i);
		$i->delete();
		$this->session->putFlash('success', 'Item deleted successfully.');
		return $this->redirectSamePage('items:home', ['move_id' => $move_id, 'box_id' => $box_id]);
	}
}