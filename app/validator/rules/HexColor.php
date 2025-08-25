<?php
namespace app\validator\rules;

use mako\validator\rules\I18nAwareInterface;
use mako\validator\rules\RuleInterface;
use mako\validator\rules\traits\I18nAwareTrait;

class HexColor implements RuleInterface, I18nAwareInterface {
	use I18nAwareTrait;

	/**
	 * {@inheritDoc}
	 */
	public function validateWhenEmpty(): bool {
		return false;
	}

	/**
	 * {@inheritDoc}
	 */
	public function validate($value, string $field, array $input): bool {
		return preg_match('/^#(?:[a-f0-9]{6}|[a-f0-9]{3})$/i', $value) === 1;
	}

	/**
	 * {@inheritDoc}
	 */
	public function getErrorMessage(string $field): string {
		return sprintf('The %1$s field must contain a valid hexadecimal color value (#RRGGBB or #RGB).', $field);
	}
}