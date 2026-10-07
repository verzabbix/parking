/**
 * Custom presentation class for the FuturePark widget.
 *
 * Extends the base class which implements the default functionality of any widget.
 */
class FuturePark extends CWidget {

	/**
	 * Maximum supported rows of the parking lot.
	 *
	 * @type {number}
	 */
	static MAX_ROWS = 10;

	/**
	 * Maximum supported columns of the parking lot.
	 *
	 * @type {number}
	 */
	static MAX_COLUMNS = 10;

	/**
	 * Number of rows in the parking lot.
	 *
	 * @type {number}
	 */
	#rows = 0;

	/** Number of columns in the parking lot.
	 *
	 * @type {number}
	 */
	#columns = 0;

	/**
	 * Individual grid spot elements of the parking lot.
	 *
	 * @type {Object}
	 */
	#spots = {};

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

		// Maximum free time allowed.
		const max_free_time = timeUnitToSeconds(fields_data.max_free_time, false);

		try {
			const {lot_data, rows, columns} = await this.#fetchLotData(groupid);

			// No parking spots found?
			if (lot_data.size === 0) {
				this.#showNoDataFound();

				return;
			}

			// Fetch latest data ("license_plate" items) of the parking spots.
			const lot_current_state = await this.#fetchLotCurrentState({
				hostids: [...lot_data.keys()]
			});

			// Create new grid or reuse the existing one to prevent flickering.
			if (this.#rows !== rows || this.#columns !== columns) {
				this.#rows = rows;
				this.#columns = columns;

				this.#createLot(rows, columns);
			}

			// Current Unix timestamp.
			const now_ts = Math.floor(Date.now() / 1000);

			// Iterate over the parking spots.
			for (const {lastvalue, lastclock, hostid} of lot_current_state.values()) {
				const spot_data = lot_data.get(hostid);

				this.#updateSpot(spot_data.row, spot_data.column, {
					license_plate: lastvalue,
					is_overtime: lastvalue !== '' && now_ts - lastclock > max_free_time
				});
			}
		}
		catch (exception) {
			this.processUpdateErrorResponse({
				title: exception.message
			});
		}
	}

	/**
	 * Fetch the parking spots (hosts) along with the parking lot size out of the specified host group.
	 *
	 * @param {string} groupid
	 *
	 * @returns {Promise<{lot_data: Map<string, Object>, rows: number, columns: number}>}
	 */
	async #fetchLotData(groupid) {
		// Run the "host.get" ZABBIX API method and return a chained promise.
		const response = await ApiCall('host.get', {
			// Retrieve the host group for the specified host group ID only.
			groupids: [groupid],
			// Request the host IDs (those are our parking spots).
			output: ['hostid'],
			// Request the tags as well (those contain the coords of the parking spot).
			selectTags: ['tag', 'value'],
			// Request the macros as well (those contain the size of the parking lot).
			selectMacros: ['macro', 'value']
		});

		// No parking spots found? Return early.
		if (response.result.length === 0) {
			return {
				lot_data: new Map(),
				rows: 0,
				columns: 0
			};
		}

		const macros = response.result[0].macros || [];

		// Fetch the parking lot size out of the user macros of the first found parking lot.
		const rows = Number(macros.find(macro => macro.macro === '{$ROWS}')?.value || 0);
		const columns = Number(macros.find(macro => macro.macro === '{$COLUMNS}')?.value || 0);

		// No parking lot size defined? Return early.
		if (rows < 1 || columns < 1 || rows > FuturePark.MAX_ROWS || columns > FuturePark.MAX_COLUMNS) {
			throw new Error('Error: Parking lot size is out of bounds!');
		}

		const lot_data = new Map();

		for (const spot of response.result) {
			// Fetch the parking spot coordinates out of the tags.
			const row = Number(spot.tags.find(tag => tag.tag === 'row')?.value || 0);
			const column = Number(spot.tags.find(tag => tag.tag === 'column')?.value || 0);

			if (row < 1 || row > rows || column < 1 || column > columns) {
				throw new Error('Error: Parking spot coordinates are out of bounds!');
			}

			lot_data.set(spot.hostid, {row, column});
		}

		return {lot_data, rows, columns};
	}

	/**
	 * Fetch the latest data ("license_plate") of the parking spots.
	 *
	 * @param {Array<string>} hostids
	 *
	 * @returns {Promise<Map<string, Object>>}
	 */
	async #fetchLotCurrentState({hostids}) {
		const response = await ApiCall('item.get', {
			hostids,
			output: ['itemid', 'hostid', 'lastvalue', 'lastclock'],
			filter: {
				key_: ['license_plate']
			}
		});

		const current_state = new Map();

		for (const item of response.result) {
			current_state.set(item.itemid, {
				lastvalue: item.lastvalue,
				lastclock: item.lastclock,
				hostid: item.hostid
			});
		}

		return current_state;
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

		this.#spots = {};

		for (let row = 1; row <= rows; row++) {
			for (let column = 1; column <= columns; column++) {
				const cell = document.createElement('div');
				cell.classList.add('cell');

				const car = document.createElement('img');
				car.classList.add('car');
				car.src = 'modules/parking/assets/img/car.svg';
				car.alt = 'Parked Car';
				car.hidden = true;
				cell.appendChild(car);

				const license_plate = document.createElement('div');
				license_plate.classList.add('licence-plate');
				license_plate.hidden = true;
				cell.appendChild(license_plate);

				grid.appendChild(cell);

				this.#spots[`${row}-${column}`] = {cell, car, license_plate};
			}
		}

		this._body.innerHTML = '';
		this._body.appendChild(grid);
	}

	/**
	 *
	 * @param {number}  row            The parking spot row index.
	 * @param {number}  column         The parking spot column index.
	 * @param {string}  license_plate  The license plate of the currently parked car (or empty string).
	 * @param {boolean} is_overtime    Whether the parking time has exceeded the limit.
	 */
	#updateSpot(row, column, {license_plate, is_overtime}) {
		const spot = this.#spots[`${row}-${column}`];

		spot.cell.classList.toggle('overtime', is_overtime);

		spot.car.hidden = license_plate === '';

		spot.license_plate.textContent = license_plate;
		spot.license_plate.hidden = license_plate === '';
	}

	/**
	 * Show a no-data message and clear the previously displayed contents.
	 */
	#showNoDataFound() {
		// Calling this method will also invoke the onClearContents method.
		this.clearContents();

		const message_wrapper = document.createElement('div');

		// Display the standard no-data message.
		message_wrapper.textContent = 'No data found';

		// Use standard classes to specify the look of the message.
		message_wrapper.classList.add(ZBX_STYLE_NO_DATA_MESSAGE, ZBX_ICON_SEARCH_LARGE);

		this._body.appendChild(message_wrapper);
	}

	/**
	 * Intercept the clear-contents event.
	 *
	 * Resets the state as if the grid was never displayed.
	 */
	onClearContents() {
		this.#rows = 0;
		this.#columns = 0;
		this.#spots = {};
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
