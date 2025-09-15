<?php
namespace app\http\controllers;

use app\models\Box;
use app\models\Item;
use app\models\Move;
use app\models\Room;
use app\models\Tag;
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
			'boxes' => $m->boxes()->including(['fromRoom', 'toRoom', 'items', 'tags'])->paginate(),
		]);
	}

	public function newAction(Move $move, Box $box, int $move_id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$this->authorize('edit', $m);
		$b = $m->boxes()->create($box);
		return $this->safeRedirectResponse('boxes:edit', ['move_id' => $move_id, 'id' => $b->id]);
	}

	public function batchAction(Move $move, Box $box, int $move_id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$this->authorize('edit', $m);
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
		$b = $id === 'new' ? null : $box->where('id', '=', $id)->including(['items', 'tags'])->firstOrThrow();
		$this->authorize('edit', $b ?? $m);
		return $this->view->render('Pages/Boxes/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'rooms' => $m->rooms()->all(),
			'tags' => $m->tags()->all(),
			'box' => $b,
		]);
	}

	public function editAction(Move $move, Box $box, Room $room, Item $item, Tag $tag, int $move_id, int|string $id)
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
			'tags' => ['array'],
			'tags.*' => ['numeric:int'],
		]);

		// ensure they can view the rooms
		if (!empty($post['from_room_id'])) {
			$this->authorize('view', $room->getInstanceOrThrow($post['from_room_id']));
		}
		if (!empty($post['to_room_id'])) {
			$this->authorize('view', $room->getInstanceOrThrow($post['to_room_id']));
		}

		// create or save box details
		if ($id === 'new') {
			$this->authorize('edit', $m);
			$box->requireAndAssign($post);
			$b = $m->boxes()->create($box);
			$this->linkTags($tag, $b, $post['tags'] ?? []);
			$this->assignItems($item, $post['items'] ?? []);
			$this->session->putFlash('success', 'Box added successfully.');
			return $this->safeRedirectResponse('boxes:edit', ['move_id' => $move_id, 'id' => $b->id]);
		} else {
			$b = $box->getInstanceOrThrow($id);
			$this->authorize('edit', $b);
			$record = $b->requireAndAssign($post);
			$record->save();
			$this->linkTags($tag, $b, $post['tags'] ?? []);
			$this->assignItems($item, $post['items'] ?? []);
			$this->session->putFlash('success', 'Box updated successfully.');
			return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
		}
	}

	protected function assignItems(Item $item, array $items): void
	{
		foreach ($items as $id => $post) {
			$i = $item->getInstanceOrThrow($id);
			$this->authorize('edit', $i);
			$i->requireAndAssign($post)->save();
		}
	}

	protected function linkTags(Tag $tag, Box $record, array $tag_ids): void
	{
		// remove existing tags
		$record->tags()->unlink();

		// (re-)add tags
		foreach ($tag_ids as $id) {
			$t = $tag->getInstanceOrThrow($id);
			$this->authorize('view', $t);
			$record->tags()->link($t);
		}
	}

	public function deleteAction(Move $move, Box $box, int $move_id, int $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$b = $box->getInstanceOrThrow($id);
		$this->authorize('delete', $b);
		$b->delete();
		$this->session->putFlash('success', 'Box deleted successfully.');
		return $this->safeRedirectResponse('boxes:home', ['move_id' => $move_id]);
	}
}