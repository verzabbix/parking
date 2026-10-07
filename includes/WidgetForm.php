<?php declare(strict_types = 0);

namespace Modules\FuturePark\Includes;

use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};

use Zabbix\Widgets\Fields\{
	CWidgetFieldMultiSelectGroup
};

/**
 * Custom configuration class for the Future Parking widget.
 *
 * The class defines the configuration data structure along with the validation rules of the widget.
 */
class WidgetForm extends CWidgetForm {

	/**
	 * Specify the configuration fields of the widget.
	 *
	 * Invoked by the dashboard framework.
	 */
	public function addFields(): self {
		return $this
			->addField(
				// Add a host group selection field to the configuration.
				(new CWidgetFieldMultiSelectGroup('groupid', _('Host group')))
					// Make the field mandatory.
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
					// Only allow a single host group selection.
					->setMultiple(false)
			)
			->addField(
				// Add a free time input field to the configuration.
				(new CFutureParkTimeBox('max_free_time', _('Maximum free time')))
					->setDefault('1h')
					// Make the field mandatory.
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
			);
	}
}
