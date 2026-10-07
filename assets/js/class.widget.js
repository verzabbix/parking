/**
 * Custom presentation class for the FuturePark widget.
 *
 * Extends the base class which implements the default functionality of any widget.
 */
class FuturePark extends CWidget {

	/**
	 * Promise to update the widget.
	 *
	 * Overloads the default implementation of the update method.
	 *
	 * @see CWidget.promiseUpdate
	 *
	 * @returns {Promise<void>}
	 */
	async promiseUpdate() {
		const grid = document.createElement('div');
		grid.classList.add('grid');

		for (let row = 1; row <= 3; row++) {
			for (let column = 1; column <= 3; column++) {
				const cell = document.createElement('div');
				cell.classList.add('cell');

				const car = document.createElement('img');
				car.classList.add('car');
				car.src = 'modules/parking/assets/img/car.svg';
				car.alt = 'Parked Car';
				cell.appendChild(car);

				const license_plate = document.createElement('div');
				license_plate.classList.add('licence-plate');
				license_plate.textContent = 'LV-1234';
				cell.appendChild(license_plate);

				grid.appendChild(cell);
			}
		}

		this._body.innerHTML = '';
		this._body.appendChild(grid);
	}

	/**
	 * Turn off the text mode and use all available space for widget presentation.
	 *
	 * @returns {boolean}
	 */
	hasPadding() {
		return false;
	}
}
