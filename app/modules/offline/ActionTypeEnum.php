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

	/**
	 * Determine if the given action is of a supported type for offline caching.
	 *
	 * @param mixed $action The action to evaluate.
	 * @return boolean True if the action is supported, false otherwise.
	 */
	public static function isSupported(mixed $action): bool {
		return static::from($action) !== static::UNKNOWN;
	}
}