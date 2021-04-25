/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"zpm/e861/wo/ze861notifcreate/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});