<?php
namespace app\http\controllers;

use app\models\Move;
use app\models\Tag;
use app\traits\MoveSwitcherTrait;

class Tags extends ControllerBase
{
	use MoveSwitcherTrait;

	public function home(Move $move, int $move_id)
	{
		if ($r = $this->checkMove($move, $move_id, $m)) return $r;

		// render the page
		return $this->view->render('Pages/Tags/Home', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'tags' => $m->tags()->all(),
		]);
	}

	public function edit(Move $move, Tag $tag, int $move_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$return = $this->view->render('Pages/Tags/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'tag' => ($t = $id === 'new' ? null : $tag->getInstanceOrThrow($id)), // get valid tag instance if not new
		]);

		$this->authorize('edit', $t ?? $m); // authorize either tag, or move if new

		return $return;
	}

	public function editAction(Move $move, Tag $tag, int $move_id, int|string $id)
	{
		// validate and get the input
		$post = $this->getValidatedInput($tag->getValidatorSpec());

		if ($id === 'new') {
			// create new tag
			$tag->requireAndAssign($post);
			$m = $move->getInstanceOrThrow($move_id);
			$this->authorize('edit', $m);
			$r = $m->tags()->create($tag);

			// send to tags home
			$this->session->putFlash('success', 'Tag added successfully.');
			return $this->safeRedirectResponse('tags:home', ['move_id' => $move_id]);
		} else {
			// update existing tag
			$r = $tag->getInstanceOrThrow($id);
			$this->authorize('edit', $r);
			$record = $r->requireAndAssign($post);
			$record->save();

			// send to tags home
			$this->session->putFlash('success', 'Tag updated successfully.');
			return $this->safeRedirectResponse('tags:home', ['move_id' => $move_id]);
		}
	}

	public function deleteAction(Tag $tag, int $move_id, int $id)
	{
		$r = $tag->getInstanceOrThrow($id);
		$this->authorize('delete', $r);
		$r->delete();
		$this->session->putFlash('success', 'Tag deleted successfully.');
		return $this->safeRedirectResponse('tags:home', ['move_id' => $move_id]);
	}
}