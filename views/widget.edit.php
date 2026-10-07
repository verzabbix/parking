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
	->addField(
		(new CWidgetFieldTimePeriodView($data['fields']['time_period']))
			->setDateFormat(ZBX_FULL_DATE_TIME)
			->setFromPlaceholder(_('YYYY-MM-DD hh:mm:ss'))
			->setToPlaceholder(_('YYYY-MM-DD hh:mm:ss'))
	)
	->show();
