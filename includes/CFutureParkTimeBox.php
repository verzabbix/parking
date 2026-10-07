<?php

namespace Modules\FuturePark\Includes;

use Zabbix\Widgets\Fields\CWidgetFieldTextBox;

/**
 * Custom time input field for Future Parking widget.
 *
 * Allows entering time in a standard Zabbix format like 45m or 2h.
 */
class CFutureParkTimeBox extends CWidgetFieldTextBox {

	public function __construct(string $name, ?string $label = null) {
		parent::__construct($name, $label);

		$this->setValidationRules(['type' => API_TIME_UNIT]);
	}
}
