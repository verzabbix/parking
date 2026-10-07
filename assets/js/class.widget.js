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
		// Get the current configuration data.
		const fields_data = this.getFieldsData();

		// Get the ID of the host group containing all the parking spots as hosts (IDs always have a type of array).
		const groupid = fields_data.groupid[0];

		const {rows, columns} = await this.#fetchLotData(groupid);

		this.#createLot(rows, columns);
	}

	/**
	 * Fetch the parking lot size out of the specified host group.
	 *
	 * @param {string} groupid
	 *
	 * @returns {Promise<{rows: number, columns: number}>}
	 */
	async #fetchLotData(groupid) {
		// Run the "host.get" ZABBIX API method and return a chained promise.
		const response = await ApiCall('host.get', {
			// Retrieve the host group for the specified host group ID only.
			groupids: [groupid],
			// Request the host IDs (those are our parking spots).
			output: [],
			// Request the macros as well (those contain the size of the parking lot).
			selectMacros: ['macro', 'value'],
			// Select just one host.
			limit: 1
		});

		const macros = response.result[0].macros;

		// Fetch the parking lot size out of the user macros of the first found parking lot.
		const rows = Number(macros.find(macro => macro.macro === '{$ROWS}').value);
		const columns = Number(macros.find(macro => macro.macro === '{$COLUMNS}').value);

		return {rows, columns};
	}

	/**
	 * Create new reusable grid for the parking spots of the given size.
	 *
	 * @param {number} rows
	 * @param {number} columns
	 */
	#createLot(rows, columns) {
		const grid = document.createElement('div');
		grid.classList.add('grid');
		grid.style.setProperty('--rows', String(rows));
		grid.style.setProperty('--columns', String(columns));

		for (let row = 1; row <= rows; row++) {
			for (let column = 1; column <= columns; column++) {
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
