let Backgrid;

if (process.env.__IS_SERVER__) {
	Backgrid = null;
} else {
	Backgrid = require('backgrid');
	require('backgrid-paginator');
	require('./backgrid/filterRow.client');
	require('./backgrid/buttonsCell.client');
	require('./backgrid/bulk/checkboxCell.client');
	require('./backgrid/bulk/selectAllCell.client');
}

module.exports = Backgrid;