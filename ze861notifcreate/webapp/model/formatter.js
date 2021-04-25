/**
 * CHANGE LOG:
 * YYYYMMDD: Remarks
 * 
 * 20180815: getCtrlMandatorySetting - Update name from bMandatory to bV8nMandatory
 * Version: 1.0.6
 * 
 * 20190309: added date/time functions
 * Version 1.0.07
 * 
 */
sap.ui.define([
		"sap/ui/core/format/NumberFormat"
	],
	function(
		NumberFormat) {
		"use strict";

		/**
		 * Concantenates two string values with hyphen
		 * @private
		 * @param {string} sValue1 - left hand side value
		 * @param {string} sValue2 - right hand side value
		 * @param {boolean} bSpaced - if true, add one space before and after the sChar
		 * @param {boolean} sChar - character to use as the hyphen 
		 * @returns {string} hyphenated string of sValue1 and sValue2
		 **/
		var _concatenate = function(sValue1, sValue2, bSpaced, sChar) {

			var sSpacer = "";

			if ((typeof bSpaced !== undefined) && (bSpaced === true)) {
				sSpacer = " ";
			}

			if (sValue1 !== undefined && sValue1 !== "" && sValue2 !== undefined && sValue2 !== "") {
				return sValue1 + sSpacer + sChar + sSpacer + sValue2;
			} else if (sValue1 !== undefined && sValue1 !== "") {
				return sValue1;
			} else if (sValue2 !== undefined && sValue2 !== "") {
				return sValue2;
			} else {
				return "";
			}
		};

		/**
		 * Removes leading zeros from a {string} numeric field
		 * @private
		 * @param {string} sValue - the string to remove the leading zeros from 
		 * @returns {string} sValue with leading zeros removed
		 **/
		var _removeLeadingZeros = function(sValue) {
			if (sValue) {
				return sValue.replace(/^0+/, "");
			} else {
				return "";
			}

		};
		
		/**
		 * Returns a comma separate string as array
		 * @private
		 * @param {string} sValue: comma separated string
		 * @returns {string} array of strings
		 **/
		var _convertCommaSeparatedStringToArray = function(sValue) {
			var aStr = [];
			
			if (sValue !== undefined && sValue !== null && sValue !== "") {				
				aStr = sValue.split(",");
			}
			return aStr;
		};
		
		/**
		 * Returns the number of days difference between two dates
		 * @private
		 * @param {string} sUTCDate1: Date from
		 * @param {string} sUTCDate2: Date to
		 * @returns {number} sUTCDate2: Date to
		 **/
		var _getDaysDiff = function(oUTCDate1, oUTCDate2) {
			
			return Math.floor((Date.UTC(oUTCDate1.getFullYear(), oUTCDate1.getMonth(), oUTCDate1.getDate()) - Date.UTC(oUTCDate2.getFullYear(), oUTCDate2.getMonth(), oUTCDate2.getDate()) ) /(1000 * 60 * 60 * 24));
		};
		
		var _formatTime = function(value) {
			if (value && value.ms !== 0) {
				var date = new Date(value.ms);
				var timeinmiliseconds = date.getTime(); //date.getTime(); //date.getSeconds(); //date.getTime(); 
				var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "KK:mm:ss a"
				});
				var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				var timeStr = oTimeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));
	
				return timeStr;
			} else {
				return "";
			}
		};
		
		var _parenthesis = function (sValue1, sValue2, bSpaced) {
			var sSpacer = "";
	
			if ((typeof bSpaced !== undefined) && (bSpaced === true)) {
				sSpacer = " ";
			}
	
			if (sValue1 !== "" && sValue1 !== undefined && sValue2 !== "" && sValue2 !== undefined) {
				return sValue1 + sSpacer + "(" + sValue2 + ")";
			} else if (sValue1 !== "" && sValue1 !== undefined) {
				return sValue1;
			} else if (sValue2 !== "" && sValue2 !== undefined) {
				return sValue2;
			} else {
				return "";
			}
		};
		
		var _isValidObject = function(oParam){
			if(oParam !== null && oParam !== undefined && oParam !== "") {
				return true;
			}	
			return false;
		};
		
		
		var _getRelativeDateTime = function(oStamp, bShowFull) {
			var oToday = new Date();
			var iDaysDiff = 0;
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				    pattern: "EEE MMM d, yyyy h:mm a"
				});
			var sRelativeStamp;
			
			if (oStamp !== undefined && oStamp !== null & oStamp !== "") {
				if (bShowFull) {
					sRelativeStamp = oDateFormat.format(oStamp);
				} else {
					iDaysDiff = _getDaysDiff(oToday, oStamp);
					if (iDaysDiff < 1) {
						oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						    pattern: "h:mm a"
						});
						sRelativeStamp = oDateFormat.format(oStamp);
					} else if (iDaysDiff < 7) {
						oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						    pattern: "EEE"
						});
						sRelativeStamp = oDateFormat.format(oStamp);
					} else {
						oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						    style: "medium",
						    UTC: true
						});
						sRelativeStamp = oDateFormat.format(oStamp);
					}
				}
			}
			return sRelativeStamp;
		};
		
		return {
			
			parenthesis: function (sValue1, sValue2) {
				var bOptionalSpaced = true;
				return _parenthesis(sValue1, sValue2, bOptionalSpaced);
			},
			
			removeLeadingZeros2WithParenthesis: function (sValue1, sValue2) {
				var bOptionalSpaced = true;
				sValue2 = _removeLeadingZeros(sValue2);
				return _parenthesis(sValue1, sValue2, bOptionalSpaced);
			},
			
			removeLeadingZeros2WithParenthesisSelective: function (sValue1, sValue2) {
				var bOptionalSpaced = true;
				sValue2 = _removeLeadingZeros(sValue2);
				return _isValidObject(sValue1) ? sValue1 : _parenthesis(sValue1, sValue2, bOptionalSpaced);
			},
			
			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},

			/* =========================================================== */
			/* Std Value Check methods				                       */
			/* =========================================================== */

			/**
			 * Returns the true if object is not defined or is null
			 * @public
			 * @param {object} oObject: object to be evaluated
			 * @returns {boolean} true if undefined; otherwise, false
			 **/
			isUndefined: function(oObject) {
				var bEmpty = true;
				
				if (typeof oObject !== "undefined" && oObject !== null) {
					bEmpty = false;
				}
				return bEmpty;
			},

			/**
			 * Determines if the variable is empty
			 * @public
			 * @param {string} sValue: to be evaluated
			 * @returns {boolean} true if empty; otherwise, false
			 **/
			isEmptyString: function(sValue) {
				var bEmpty = true;
				
				if (typeof sValue !== "undefined" && sValue !== null && sValue !== "") {
					bEmpty = false;
				}
				return bEmpty;
			},


			/* =========================================================== */
			/* Std Math Ops methods					                       */
			/* =========================================================== */

			/**
			 * Multiplies two numbers and formats to decimal places
			 * @public
			 * @param {string} sValue1: value 1
			 * @param {string} sValue2: value 2
			 * @param {string} sDecimals: (optional) number of decimal places
			 * @returns {float} formatted float
			 **/
			multiply: function(sValue1, sValue2, sDecimals) {
				var oFormat;
				var fResult;
				
				var fValue1 = isNaN(sValue1) ? 0 : parseFloat(sValue1,10);
				var fValue2 = isNaN(sValue2) ? 0 : parseFloat(sValue2,10);
				var iDecimals = isNaN(sDecimals) ? 0 : parseInt(sDecimals,10);

				fResult = fValue1 * fValue2;

				if (sDecimals !== undefined && sDecimals !== null && !isNaN(sDecimals)) {
					oFormat = NumberFormat.getFloatInstance({decimals: iDecimals});
					return oFormat.format(fResult);
				} else {
					return fResult;
				}
			},
			
			subtract: function(sValue1, sValue2){
				return parseFloat(sValue1) - parseFloat(sValue2);
			},
			
			/**
			 * Compute perecent deliveried
			 * @public
			 * @param {string} fOpenVal: open qty/val
			 * @param {string} fOrdVal: order qty/val
			 * @returns {number} percent received
			 **/
			computePercentDelivered: function(fOpenVal, fOrdVal) {
				var fPercent = 0;
				
				if (!isNaN(parseFloat(fOpenVal,10)) && !isNaN(parseFloat(fOrdVal,10))) {
					if (parseFloat(fOrdVal,10) !== 0) {
						fPercent = ((parseFloat(fOrdVal,10) - parseFloat(fOpenVal,10)) * 100 / parseFloat(fOrdVal,10)).toFixed(2);
						// toFixed converts the number to string
						// Convert it back to float
						fPercent = parseFloat(fPercent, 10);
					}
				}
				return fPercent;
			},
			
			/**
			 * Compute perecent 
			 * @public
			 * @param {string} fVal: value
			 * @param {string} fTtlVal: total value
			 * @returns {number} percent received
			 **/
			computePercent: function(fVal, fTtlVal) {
				var fPercent = 0;
				
				if (!isNaN(parseFloat(fVal, 10)) && !isNaN(parseFloat(fTtlVal,10))) {
					if (parseFloat(fVal,10) !== 0) {
						fPercent = (parseFloat(fVal,10) * 100 / parseFloat(fTtlVal,10)).toFixed(2);
						// toFixed converts the number to string
						// Convert it back to float
						fPercent = parseFloat(fPercent, 10);
					}
				}
				return fPercent;
			},
			
			
			/* =========================================================== */
			/* Std Number methods					                       */
			/* =========================================================== */

			/**
			 * Rounds a float value to a number of decimal places - zeros after decimal pt are suppressed
			 * @public
			 * @param {string} sValue: value as string
			 * @param {string} sDecimals: number of decimal places as string
			 * @returns {float} float value formatted
			 **/
			toNumber: function(sValue, sDecimals) {
				var fValue = isNaN(sValue) ? 0 : parseFloat(sValue,10);
				var iDecimals = isNaN(sDecimals) ? 0 : parseInt(sDecimals,10);
				
				if (sDecimals !== undefined && sDecimals !== null && !isNaN(sDecimals)) {
					return parseFloat(fValue.toFixed(iDecimals), 10);
				} else {
					return fValue;
				}
			},

			/**
			 * Converts a float to an absolute number number
			 * @public
			 * @param {string} sValue: numeric string or float to be converted to an absolute value
			 * @returns {float} sValue converted to an absolute number 
			 **/
			toAbsoluteNumber: function(sValue) {
				var fValue = isNaN(sValue) ? 0 : parseFloat(sValue,10);
				
				return Math.abs(fValue);
			},

			/**
			 * Formats a number with thousands separator
			 * @public
			 * @param {string} sValue: number to be formatted
			 * @param {string} sDecimals: number of decimal places
			 * @returns {float} formatted number
			 **/
			formatNumberWithThousandsSeparator: function(sValue, sDecimals) {
				var oFormat;
				var fValue = isNaN(sValue) ? 0 : parseFloat(sValue,10);
				var iDecimals = isNaN(sDecimals) ? 0 : parseInt(sDecimals,10);

				if (sDecimals !== undefined && sDecimals !== null && !isNaN(sDecimals)) {
					oFormat = NumberFormat.getFloatInstance({decimals: iDecimals});
					return oFormat.format(fValue);
				} else {
					return fValue;
				}
			},


			/* =========================================================== */
			/* Std Array methods					                       */
			/* =========================================================== */
			
			/**
			 * Returns a comma separate string as array
			 * @public
			 * @param {string} sValue: comma separated string
			 * @returns {string} array of strings
			 **/
			convertCommaSeparatedStringToArray: function(sValue) {
				
				return _convertCommaSeparatedStringToArray(sValue);
				
			},
			

			/* =========================================================== */
			/* Std String Concatenation methods		                       */
			/* =========================================================== */

			/**
			 * Concantenates two string values
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - middle
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			concatenate: function(sValue1, sValue2, bSpaced) {

				return _concatenate(sValue1, sValue2, bSpaced, "");

			},

			/**
			 * Concantenates frist two values and then hypenates the third values
			 * @public
			 * @param {string} sValue1 - first value
			 * @param {string} sValue2 - second value
			 * @param {string} sValue3 - third value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			concatenateHyphenate: function(sValue1, sValue2, sValue3, bSpaced) {

				var s1 = _concatenate(sValue1, sValue2, false, "");
				return _concatenate(s1, sValue3, bSpaced, "-");

			},
			
			/**
			 * Concantenates frist two values and then hypenates the third values
			 * @public
			 * @param {string} sValue1 - first value
			 * @param {string} sValue2 - second value
			 * @param {string} sValue3 - third value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			concatenateThree: function(sValue1, sValue2, sValue3, bSpaced) {

				var s1 = _concatenate(sValue1, sValue2, false, ": ");
				return _concatenate(s1, sValue3, bSpaced, " ");

			},

			/**
			 * Concantenates two values with a hyphen
			 * @public
			 * @param {string} sValue1 - first value
			 * @param {string} sValue2 - second value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			hyphenate: function(sValue1, sValue2, bSpaced) {

				var sValue = _concatenate(sValue1, sValue2, bSpaced, "-");
				return sValue;

			},
			
			/**
			 * Concantenates two values with a colon
			 * @public
			 * @param {string} sValue1 - first value
			 * @param {string} sValue2 - second value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			colonate: function(sValue1, sValue2, bSpaced) {

				var sValue = _concatenate(sValue1, sValue2, bSpaced, ": ");
				return sValue;

			},

			/**
			 * Concantenates two string values with slash
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			slashed: function(sValue1, sValue2, bSpaced) {

				return _concatenate(sValue1, sValue2, bSpaced, "/");

			},

			/**
			 * Concantenates upto five values with dot between every two values
			 * @public
			 * @param {string} sValue1 - first value
			 * @param {string} sValue2 - second value
			 * @param {string} sValue3 - third value
			 * @param {string} sValue4 - fourth value
			 * @param {string} sValue5 - fifth value
			 * @returns {string} formatted string
			 **/
			dotNotation: function(sValue1, sValue2, sValue3, sValue4, sValue5) {

				var sValue = _concatenate(sValue1, sValue2, false, ".");
				sValue = _concatenate(sValue, sValue3, false, ".");
				sValue = _concatenate(sValue, sValue4, false, ".");
				sValue = _concatenate(sValue, sValue5, false, ".");
				return sValue;

			},

			/**
			 * Concantenates two string values as key value pair
			 * @public
			 * @param {string} sKey - key parameter
			 * @param {string} sValue - value parameter
			 * @returns {string} formatted string
			 **/
			keyValuePair: function(sKey, sValue) {

				return _concatenate(sKey, sValue, false, ": ");

			},

			/**
			 * Removes leading zeros from a a value
			 * @public
			 * @param {string} sValue - value to be formatted
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros: function(sValue) {

				return _removeLeadingZeros(sValue);

			},

			/**
			 * Removes leading zeros from both values and then hyphenates them
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZerosAndHyphenate: function(sValue1, sValue2, bSpaced) {
				var sVal1 = _removeLeadingZeros(sValue1);
				var sVal2 = _removeLeadingZeros(sValue2);
				return _concatenate(sVal1, sVal2, bSpaced, "-");
			},

			/**
			 * Removes leading zeros from sValue1 and then hyphenates with sValue2
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros1AndHyphenate: function(sValue1, sValue2, bSpaced) {
				var sVal1 = _removeLeadingZeros(sValue1);
				return _concatenate(sVal1, sValue2, bSpaced, "-");
			},

			/**
			 * Removes leading zeros from sValue2 and then hyphenates with sValue1
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros2AndHyphenate: function(sValue1, sValue2, bSpaced) {
				var sVal2 = _removeLeadingZeros(sValue2);
				return _concatenate(sValue1, sVal2, bSpaced, "-");
			},

			/**
			 * Removes leading zeros from both values and then concatenates them with a slash
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZerosAndSlashed: function(sValue1, sValue2, bSpaced) {
				var sVal1 = _removeLeadingZeros(sValue1);
				var sVal2 = _removeLeadingZeros(sValue2);
				return _concatenate(sVal1, sVal2, bSpaced, "/");
			},

			/**
			 * Removes leading zeros from sValue1 and then concatenates with sValue2 with a slash
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros1AndSlashed: function(sValue1, sValue2, bSpaced) {
				var sVal1 = _removeLeadingZeros(sValue1);
				return _concatenate(sVal1, sValue2, bSpaced, "/");
			},

			/**
			 * Removes leading zeros from sValue2 and then concatenates with sValue1 with a slash
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros2AndSlashed: function(sValue1, sValue2, bSpaced) {
				var sVal2 = _removeLeadingZeros(sValue2);
				return _concatenate(sValue1, sVal2, bSpaced, "/");
			},
			
			/**
			 * Removes leading zeros from sValue2 and then concatenates with sValue1 with a slash
			 * @public
			 * @param {string} sValue1 - left hand side value
			 * @param {string} sValue2 - right hand side value
			 * @param {boolean} bSpaced - if true, a space is added between two values
			 * @returns {string} formatted string
			 **/
			removeLeadingZeros1And2AndSlashed: function(sValue1, sValue2, bSpaced) {
				var sVal1 = _removeLeadingZeros(sValue1);
				var sVal2 = _removeLeadingZeros(sValue2);
				return _concatenate(sVal1, sVal2, bSpaced, "/");
			},

			/* =========================================================== */
			/* Std Address methods					                       */
			/* =========================================================== */

			/**
			 * Formats address fields into a single string
			 * @public
			 * @param {string} sStreet - street address
			 * @param {string} sCity - city
			 * @param {string} sState - state or province
			 * @param {string} sZip - zip or postal code
			 * @param {string} sCountry - country
			 * @returns {string} formatted string
			 **/
			formatAddress: function(sStreet, sCity, sState, sZip, sCountry) {
				var sAddress = "";

				if (sStreet && sStreet !== "") {
					sAddress = sStreet;
				}

				if (sCity && sCity !== "") {
					if (sAddress && sAddress !== "") {
						sAddress = sAddress + ", " + sCity;
					} else {
						sAddress = sCity;
					}
				}

				if (sState && sState !== "") {
					if (sAddress && sAddress !== "") {
						sAddress = sAddress + ", " + sState;
					} else {
						sAddress = sState;
					}
				}

				if (sState && sState !== "" && sZip && sZip !== "" && sAddress && sAddress !== "") {
					sAddress = sAddress + " " + sZip;
				}

				if (sCountry && sCountry !== "") {
					if (sAddress && sAddress !== "") {
						sAddress = sAddress + ", " + sCountry;
					} else {
						sAddress = sCountry;
					}
				}
				return sAddress;
			},



			/* =========================================================== */
			/* Std Icon methods						                       */
			/* =========================================================== */

			/**
			 * Retruns icon name based media type
			 * @public
			 * @param {string} sMediaType: string parameter
			 * @returns {string} full icon url
			 **/
			getMediaTypeIcon: function(sMediaType) {
				var sIcon = "sap-icon://attachment";
				
				if (typeof sMediaType === "string") {
					switch (sMediaType.toUpperCase()) {
						case "PDF":
							sIcon = "sap-icon://pdf-attachment";
							break;
						case "JPG":
						case "PNG":
						case "GIF":
						case "TIFF":
						case "JPEG":
						case "BMP":
							sIcon = "sap-icon://camera";
							break;
						case "DOC":
						case "DOCX":
							sIcon = "sap-icon://doc-attachment";
							break;
						case "XLS":
						case "XLSX":
							sIcon = "sap-icon://excel-attachment";
							break;
						case "PPT":
						case "PPTX":
							sIcon = "sap-icon://ppt-attachment";
							break;
					}
				}
				return sIcon;
			},

			/* =========================================================== */
			/* Std V8n methods						                       */
			/* =========================================================== */

			/**
			 * Retruns Icon Color based on V8n type
			 * @public
			 * @param {string} sType: status type 
			 * @returns {string} Notification Priority
			 **/
			getV8nTypeIconColor: function(sType) {
				var sColor = "None";

				switch (sType) {
					case sap.ui.core.MessageType.Error:
						sColor = "Negative";
						break;
					case sap.ui.core.MessageType.Warning:
						sColor = "Critical";
						break;
					case sap.ui.core.MessageType.Information:
						sColor = "Neutral";
						break;
					case sap.ui.core.MessageType.Success:
						sColor = "Positive";
						break;
					case sap.ui.core.MessageType.None:
						sColor = "Default";
						break;
				}
				return sColor;
			},

			/**
			 * Retruns Notification Item Priority based on V8n state
			 * @public
			 * @param {string} sType: status type 
			 * @returns {string} Notification Priority
			 **/
			getV8nTypeIcon: function(sType) {
				var sIcon = "None";

				switch (sType) {
					case sap.ui.core.MessageType.Error:
						sIcon = "sap-icon://message-error";
						break;
					case sap.ui.core.MessageType.Warning:
						sIcon = "sap-icon://message-warning";
						break;
					case sap.ui.core.MessageType.Information:
						sIcon = "sap-icon://message-information";
						break;
					case sap.ui.core.MessageType.Success:
						sIcon = "sap-icon://message-success";
						break;
					case sap.ui.core.MessageType.None:
						// sIcon = "sap-icon://message-information";
						sIcon = "";
						break;
				}
				return sIcon;
			},
			
			/**
			 * Returns Hide UI Controls if BO is not supported
			 * @public
			 * @param {string} sType: Bus Object Type
			 * @returns {boolean} 
			 **/
			showIfPropertyAvailable: function(sProperty) {
				if (_isValidObject(sProperty)) {
					return true;
				}
				return false;
			},
			
			getRelativeDateTime: function(oStamp, bShowFull) {
				return _getRelativeDateTime(oStamp, bShowFull);
			},
			
			getReadStamp: function(sReadFlg, sUserId, sUserName, sDateTimeStamp) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					    pattern: "EEE MMM d, yyyy 'at' h:mm a"
					});
				var sReadStamp = "";
				
				if (sReadFlg === "X") {
					sReadStamp = "Read";
					
					if (sUserName !== undefined && sUserName !== null  && sUserName !== "") {
						sReadStamp += " by " + sUserName;
					} else if (sUserId !== undefined && sUserId !== null && sUserId !== "") {
						sReadStamp += " by " + sUserId;
					}
					
					if (sDateTimeStamp !== undefined && sDateTimeStamp !== null && sDateTimeStamp !== "") {
						sReadStamp += " on " + oDateFormat.format(sDateTimeStamp);
					}
				}
				return sReadStamp;
			},
			
			formatCurrencyValue: function (sValue) {
				if (!sValue) {
					return "";
				}
				var oFormat = NumberFormat.getFloatInstance({
					decimals: 2
				});
				return oFormat.format(sValue);
			},
			
			formatDate: function(d) {
				if (d === null || d === "" || d === undefined) {
					return "";
				} else {
					var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						style: "medium",
						UTC: true
					});
					//Returns a DateFormat instance for date
					var F = oDateFormat.format(d, true);
					return F;
				}
			},
			
			formatDateTime: function(d, t)  {
				if (d === null || d === "" || d === undefined) {
					return "";
				} else {
					var	oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
						style: "medium",
						UTC: true
					});
		
					//Returns a DateFormat instance for date and time
					var	F = oDateFormat.format(d, true);
					var time = "";
					if (t) {
						time = _formatTime(t);
					}
					return F + " " + time;
				}
			},
		
			formatTime: function(value) {
				return _formatTime(value);
			},
			
			getTotalCurrencyValue: function (sQty, sValue, fPer) {
				if (!sQty || !sValue) {
					return "";
				}
				var oFormat = NumberFormat.getFloatInstance({
					decimals: 2
				});
				var fValue = sQty * sValue;
				return fPer !== 0 ? oFormat.format(fValue / fPer) : oFormat.format(fValue);
			},
			
			getTypeIcon: function(sType) {
				var sIcon = "";
				
				switch (sType) {
					case "FUNCLOC":
						sIcon = "sap-icon://functional-location";
						break;
					case "EQUI":
						sIcon = "sap-icon://machine";
						break;
					case "MAT":
						sIcon = "sap-icon://product";
						break;
				}
				return sIcon;
			},
			
			getTypeDesc: function(sType) {
				var sDesc = "";
				
				switch (sType) {
					case "FUNCLOC":
						sDesc = "FLoc: ";
						break;
					case "EQUI":
						sDesc = "Eqp: ";
						break;
					case "MAT":
						sDesc = "Mat: ";
						break;
				}
				return sDesc;
			},
			
			getTypeTitle: function(sType) {
				var sDesc = "";
				
				switch (sType) {
					case "FUNCLOC":
						sDesc = "Functional Location";
						break;
					case "EQUI":
						sDesc = "Equipment";
						break;
					case "MAT":
						sDesc = "Material ";
						break;
				}
				return sDesc;
			}
	};
});