<?php
namespace app\http\controllers;

use app\models\Room;
use app\models\Move;
use app\traits\MoveSwitcherTrait;

class Rooms extends ControllerBase
{
	use MoveSwitcherTrait;

	public function home(Move $move, int $move_id)
	{
		if ($r = $this->checkMove($move, $move_id, $m)) return $r;

		// render the page
		return $this->view->render('Pages/Rooms/Home', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move_id' => $move_id,
			'moves' => $this->getUser()->moves()->all(),
			'rooms' => $m->rooms()->all(),
			'location' => $this->session->getFlash('location_tab', 'from'),
		]);
	}

	public function edit(Move $move, Room $room, int $move_id, int|string $id)
	{
		$m = $move->getInstanceOrThrow($move_id);
		$return = $this->view->render('Pages/Rooms/Edit', [
			'active_move_id' => $this->getUser()->active_move_id,
			'move' => $m,
			'room' => ($r = $id === 'new' ? null : $room->getInstanceOrThrow($id)), // get valid room instance if not new
		]);

		// note location tab for back button
		$this->session->putFlash('location_tab', $r?->location ?? 'from');

		return $return;
	}

	public function editAction(Move $move, Room $room, int $move_id, int|string $id)
	{
		// disallow changing location after creation
		$rules = $room->getValidatorSpec();
		if ($id !== 'new') {
			unset($rules['location']);
		}

		// validate and get the input
		$post = $this->getValidatedInput($rules);

		if ($id === 'new') {
			// create new room
			$room->requireAndAssign($post);
			$m = $move->getInstanceOrThrow($move_id);
			$r = $m->rooms()->create($room);

			// note location tab for reload
			$this->session->putFlash('location_tab', $post['location'] ?? 'from');

			// send to rooms home
			$this->session->putFlash('success', 'Room added successfully.');
			return $this->safeRedirectResponse('rooms:home', ['move_id' => $move_id]);
		} else {
			// update existing room
			$record = $room->getInstanceOrThrow($id)->requireAndAssign($post);
			$record->save();

			// note location tab for reload
			$this->session->putFlash('location_tab', $record->location);

			// send to rooms home
			$this->session->putFlash('success', 'Room updated successfully.');
			return $this->safeRedirectResponse('rooms:home', ['move_id' => $move_id]);
		}
	}

	public function deleteAction(Move $move, Room $room, int $move_id, int $id)
	{
		$room->getInstanceOrThrow($id)->delete();
		$this->session->putFlash('success', 'Room deleted successfully.');
		return $this->safeRedirectResponse('rooms:home', ['move_id' => $move_id]);
	}
}