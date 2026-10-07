<?php declare(strict_types = 0);

/**
 * @var CView $this
 * @var array $data
 */

// The presentation of the Future Parking widget configuration form.

(new CWidgetFormView($data))
	->addField(
		new CWidgetFieldMultiSelectGroupView($data['fields']['groupid'])
	)
	->addField(
		(new CWidgetFieldTextBoxView($data['fields']['max_free_time']))
			->setPlaceholder(_('1h'))
			->setWidth(ZBX_TEXTAREA_TINY_WIDTH)
	)
	->show();
