<?php
namespace app\modules\offline;

enum ActionTypeEnum {
	case METHOD;
	case FUNCTION;
	case UNKNOWN;

	/**
	 * Determine the action type from the given action.
	 * 
	 * @param mixed $action The action to evaluate.
	 * @return ActionTypeEnum
	 */
	public static function from(mixed $action): ActionTypeEnum {
		if (
			is_array($action)
			&& isset($action[0], $action[1])
			&& (
				is_object($action[0])
				|| is_string($action[0])
			)
			&& is_string($action[1])
			&& method_exists($action[0], $action[1])
		) {
			// class or object method
			return static::METHOD;
		} elseif (is_callable($action)) {
			// closure or function name
			return static::FUNCTION;
		} else {
			// unsupported action type
			return static::UNKNOWN;
		}
	}
}