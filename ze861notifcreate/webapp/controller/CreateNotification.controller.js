sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/model/Binding",
	"sap/ui/core/Fragment",
	"sap/ndc/BarcodeScanner"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageBox, Binding, Fragment, BarcodeScanner) {
	"use strict";

	return BaseController.extend("zpm.e861.wo.ze861notifcreate.controller.CreateNotification", {

		formatter: formatter,
		navPaths: [],

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			var oViewModel;
			var oThis = this;

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				enableSave: false,
				workListTitle: ""
			});
			
			var oFLPModel = this.getOwnerComponent().getModel("FLP");
			
			this.setModel(oViewModel, "view");

			// Add the worklist page to the flp routing history
			// this.addHistoryEntry({
			// 	title: this.getResourceBundle().getText("appTitle"),
			// 	icon: "sap-icon://add",
			// 	intent: "#ZNotification-create"
			// }, true);
			
			var oDataModel = this.getOwnerComponent().getModel();
			
			oDataModel.metadataLoaded().then(function () {
				oThis._oUsrModelDeferred = jQuery.Deferred();
				var oUsrModel = new JSONModel({
					bAuthorized: false
				});
				oThis.setModel(oUsrModel, "user");
				
				oDataModel.read("/UserSet", {  
					success: function(oData, oResponse) {
						if(oData.results && oData.results.length > 0) {
							var oUsr = oData.results[0];
							oUsrModel.setProperty("/", oUsr);
							oUsrModel.setProperty("/bAuthorized", oUsr.IsAuthorized);
						}
						oThis._oUsrModelDeferred.resolve();
					}, 
					error: function(oError) {
						oThis._oUsrModelDeferred.resolve();
					}
				});
				
				var fnWaitAllModelLoadFinish = function() {
					oThis._oNewNotificationContext = oDataModel.createEntry("NotifSet");
					oThis._currentEntityPath = oThis._oNewNotificationContext.sPath;
					oDataModel.newEntryContext = oThis._oNewNotificationContext;
					try {
						var sOrderType = "PM01";
						oThis.getView().unbindObject();
						oThis.getView().setBindingContext(oThis._oNewNotificationContext);
						oDataModel.setProperty(oThis._currentEntityPath + "/Priority", "4");
						oDataModel.setProperty(oThis._currentEntityPath + "/PriorityDesc", "Low");
						oDataModel.setProperty(oThis._currentEntityPath + "/Code", "0010");
						oDataModel.setProperty(oThis._currentEntityPath + "/CodeDesc", "Corrective");
						oDataModel.setProperty(oThis._currentEntityPath + "/Plant", oUsrModel.getProperty("/Plant"));
						
						oDataModel.setProperty(oThis._currentEntityPath + "/CodeGrp", sOrderType);
						oViewModel.setProperty("/workListTitle", oThis.getResourceBundle().getText("correctiveMaintenance"));
					} catch (oEve) {
						// This is an Error State.
					}
				};
				jQuery.when(oThis._oUsrModelDeferred).done(jQuery.proxy(fnWaitAllModelLoadFinish, this));
			});
			
			
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this.setModel(oMessagesModel, "message");
			
			this._oBinding = new Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function(oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						oThis.getModel("view").setProperty("/enableSave", false);
					}
				}
				
			});
		},
		
		/**
		 * Called when the view is destructed
		 * @public
		 */
		onExit: function(oEvent) {
			if(this._oCodeVHDialog) {
				this._oCodeVHDialog.destroy();
			}
			
			if(this._oEquipmentVHDialog) {
				this._oEquipmentVHDialog.destroy();
			}
			
			if(this._oFuncLocVHDialog) {
				this._oFuncLocVHDialog.destroy();
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when Create button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */
		onSavePress: function(oEvent) {
			this._oCurrentEntity = this.getModel().getProperty(this._oNewNotificationContext.getPath());
			// console.error(this._oCurrentEntity);
			this._post(false);
		},
		
		/**
		 * Event handler when Save button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */		
		onSaveAndStartPress: function(oEvent) {
			this._oCurrentEntity = this.getModel().getProperty(this._oNewNotificationContext.getPath());
			this._post(true);
		},
		
		/**
		 * Event handler when Cancel button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */		
		onCancelPress: function(oEvent){
			var oThis = this;
			MessageBox.confirm(
				oThis.getResourceBundle().getText("cancelChangesConfirmation"), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: "Cancel",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							var oFLPModel = oThis.getModel("FLP");
							var sMode = oFLPModel.getProperty("/mode");
							if(oThis._isValidObject(sMode) && sMode === "FLP") {
								sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
								    target : {semanticObject : "#"}
								});
							} else {
								sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
								    target : {semanticObject : "ZMyNotification", action : "display"}
								    // params : {"ObjectId" : sDocNo}
								});
							}
						}
					}
				}
			);
		},
		
		/**
		 * Event handler when Code is changed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */		
		onCodeChange: function (oEvent) {
			var sCode = oEvent.getParameter("value");
			var oCode = this.getModel().getProperty("/FailureCodeVHSet('" + sCode + "')");
			this.getModel().setProperty(this._currentEntityPath + "/CodeGrp", oCode.CodeGrp);
			this._validateSaveEnablement();
		},
		
		/**
		 * Event handler when Desc and other properties are changed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */		
		onPropertyChange: function (oEvent) {
			this._validateSaveEnablement();
		},
		
		/**
		 * Event handler to open Code dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/
		onOpenCodeVHDialog : function (oEvent) {
			if (!this._oCodeVHDialog) {
				this._oCodeVHDialog = sap.ui.xmlfragment(this.getView().getId() + "idCodeVHDialog", "zpm.e861.wo.ze861notifcreate.view.frags.CodeVHDialog", this);
				this.getView().addDependent(this._oCodeVHDialog);
				this._oCodeVHDialog.setModel(this.getOwnerComponent().getModel());
			}
			this._oCodeVHDialog.open();
		},
		
		/**
		 * Event handler when Code dialog is closed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onCodeVHDialogClose : function (oEvent) {
			var oThis = this;
			var sPath = this._currentEntityPath;
			var aContexts = oEvent.getParameter("selectedContexts");
			var oModel = this.getOwnerComponent().getModel();
			
			if (aContexts && aContexts.length) {
				 aContexts.map(function (oContext) { 
				 	var oCode = oContext.getObject();
				 	oModel.setProperty(sPath + "/Code", oCode.Code);
				 	oModel.setProperty(sPath + "/CodeDesc", oCode.Desc);
				 	oModel.setProperty(sPath + "/CodeGrp", oCode.CodeGrp);
				 	oThis._validateSaveEnablement();
				 	return; 
	 			 });
			}
		},
		
		/**
		 * Event handler when search is made in Searchbar in Code dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onCodeVHDialogSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new sap.ui.model.Filter("Desc", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter([oFilter]);
		},
		
		/**
		 * Event handler to open Equipment dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onOpenEquipmentVHDialog : function (oEvent) {
			var oThis = this;
			var sPlant = this.getModel("user").getData().Plant;
			
			if (!this._oEquipmentVHDialog) {
				this._oEquipmentVHDialog = sap.ui.xmlfragment(this.getView().getId() + "idEquipmentVHDialog", "zpm.e861.wo.ze861notifcreate.view.frags.EquipmentVHDialog", this);
				this.getView().addDependent(this._oEquipmentVHDialog);
				this._oEquipmentVHDialog.setModel(this.getOwnerComponent().getModel());
			}
			this._oEquipmentVHDialog.open();
			
			var oBinding = this._oEquipmentVHDialog.getBinding("items");
			oBinding.filter([
				new sap.ui.model.Filter("UserPlant", "EQ", sPlant)
			], "Application");
			oBinding.filter([]);
			
			// Focus Search Field
	        jQuery.sap.delayedCall(500, null, function() {
	            oThis._oEquipmentVHDialog._searchField.focus();
	        });
		},
		
		/**
		 * Event handler when Equipment dialog is closed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onEquipmentVHDialogClose : function (oEvent) {
			var oThis = this;
			var sPath = this._currentEntityPath;
			var aContexts = oEvent.getParameter("selectedContexts");
			var oModel = this.getModel();
			
			if (aContexts && aContexts.length) {
				 aContexts.map(function (oContext) { 
				 	var oEquipment = oContext.getObject();
				 	oModel.setProperty(sPath + "/EqpNo", oEquipment.EqpNo);
				 	// Fix This
				 	oModel.setProperty(sPath + "/EqpDesc", oEquipment.Desc);
				 	oModel.setProperty(sPath + "/FuncLocId", oEquipment.FuncLoc);
				 	oModel.setProperty(sPath + "/FuncLocDesc", oEquipment.FuncLocDesc);
				 	oThis._validateSaveEnablement();
				 	return; 
	 			 });
			}
		},
		
		/**
		 * Event handler when search is made in Searchbar in Equipment dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onEquipmentVHDialogSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oBinding = oEvent.getParameter("itemsBinding");
			if(this._isValidObject(sValue)) {
				oBinding.filter([
					new sap.ui.model.Filter("Desc", "Contains", sValue)
				]);
			} else {
				oBinding.filter([]);	
			}
		},
		
		/**
		 * Event handler to open Functional Location dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onOpenFuncLocVHDialog : function (oEvent) {
			var oThis = this;
			var sPlant = this.getModel("user").getData().Plant;
			
			if (!this._oFuncLocVHDialog) {
				this._oFuncLocVHDialog = sap.ui.xmlfragment(this.getView().getId() + "idFuncLocVHDialog", "zpm.e861.wo.ze861notifcreate.view.frags.FuncLocVHDialog", this);
				this.getView().addDependent(this._oFuncLocVHDialog);
				this._oFuncLocVHDialog.setModel(this.getOwnerComponent().getModel());
			}
			this._oFuncLocVHDialog.open();
			
			var oBinding = this._oFuncLocVHDialog.getBinding("items");
			oBinding.filter([
				new sap.ui.model.Filter("UserPlant", "EQ", sPlant)
			], "Application");
			oBinding.filter([]);
			
			// Focus Search Field
			jQuery.sap.delayedCall(500, null, function() {
	            oThis._oFuncLocVHDialog._searchField.focus();
	        });
		},
		
		/**
		 * Event handler when Functional Location dialog is closed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onFuncLocVHDialogClose : function (oEvent) {
			var oThis = this;
			var sPath = this._currentEntityPath;
			var aContexts = oEvent.getParameter("selectedContexts");
			var oModel = this.getModel();
			
			if (aContexts && aContexts.length) {
				 aContexts.map(function (oContext) { 
				 	var oFuncLoc = oContext.getObject();
				 	oModel.setProperty(sPath + "/FuncLocId", oFuncLoc.FuncLoc);
				 	oModel.setProperty(sPath + "/FuncLocDesc", oFuncLoc.Desc);
				 	oThis._validateSaveEnablement();
				 	return; 
	 			 });
			}
		},
		
		/**
		 * Event handler when search is made in Searchbar in Functional Location dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onFuncLocVHDialogSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oBinding = oEvent.getParameter("itemsBinding");
			if(this._isValidObject(sValue)) {
				oBinding.filter([
					new sap.ui.model.Filter("FuncLoc", "Contains", sValue)
				]);
			} else {
				oBinding.filter([]);	
			}
		},
		
		/**
		 * Event handler when Functional Location Barcode button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onBarCodePressFuncLoc: function (oEvent) {
			var oThis = this;
			
			try {
			    BarcodeScanner.closeScanDialog();
			} catch(oErr) {
				// Error
			}
			
			BarcodeScanner.scan(
				function (mResult) {
					if(!mResult.cancelled) {
						var oDataModel = oThis.getOwnerComponent().getModel();
						var sPlant = oThis.getModel("user").getData().Plant;
						var sValue = mResult.text;
						//var aFilters = new sap.ui.model.Filter("UserPlant", sap.ui.model.FilterOperator.EQ, sPlant);
						var aFilters = [
							new sap.ui.model.Filter("BarCode", "Contains", sValue),
							new sap.ui.model.Filter("UserPlant", "EQ", sPlant)
						];
						if (!oThis._oBarCodFuncLocDialog) {
							
							// oThis.oDefaultFuncLocDialog = new sap.ui.xmlfragment("zpm.e861.wo.ze861notifcreate.view.frags.BarCodeFuncLoc", oThis);
							// oThis.getView().addDependent(oThis.oDefaultDialog);
							oThis._sFragFuncLocId = oThis.getView().getId() + "idBarCodeFuncLocDialog";
							oThis._oBarCodFuncLocDialog = sap.ui.xmlfragment(oThis._sFragFuncLocId, "zpm.e861.wo.ze861notifcreate.view.frags.BarCodeFuncLoc", oThis);
						}
	
						// oBarCodeDialog.setModel(oDataModel);
						oDataModel.read("/FuncLocVHSet", {
							filters: [aFilters],
							success: function (oData, oResponse) {
								if (oData.results.length === 1) {
									var oModel = oThis.getModel();
									var sPath = oThis._currentEntityPath;
									var	oDataResults = oData.results[0];
									oModel.setProperty(sPath + "/FuncLocId", oDataResults.FuncLoc);
									oModel.setProperty(sPath + "/FuncLocDesc", oDataResults.Desc);
									oThis._validateSaveEnablement();
								} else if (oData.results.length > 1) {
									var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
									oJsonModel.setProperty("/barCode", sValue);
									oThis._oBarCodFuncLocDialog.setModel(oJsonModel);
									oThis._oBarCodFuncLocDialog.setModel(oThis.getModel("i18n"), "i18n");
									oThis._oBarCodFuncLocDialog.open();
									
									// Focus Search Field
							        var oSearchField = sap.ui.core.Fragment.byId(oThis._sFragFuncLocId, "FuncLocSearch");
									jQuery.sap.delayedCall(500, null, function() {
							            oSearchField.focus();
							        });
								} else {
									var msg = oThis.getResourceBundle().getText("noResultsFound");
									sap.m.MessageToast.show(msg);
								}
							},
							error: function (oError) {
								var msg = oThis.getResourceBundle().getText("ErrorReadingCall");
								sap.m.MessageToast.show(msg);
							}
						});
					}
				},
				function (Error) {
					var msg = oThis.getResourceBundle().getText("scanningFailed");
					sap.m.MessageToast.show(msg + ": " + Error);
				}
			);
		},
		
		/**
		 * Event handler to destroy Barcode Functional Location dialog instance after closing
		 * @public
		 **/		
		onFuncLocAfterClose: function() {
			this._oBarCodFuncLocDialog.destroy();
			this._oBarCodFuncLocDialog = undefined;
		},
		
		/**
		 * Event handler when search is made in Searchbar in Barcode Functional Location dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onBarCodeVHFuncLocDialogSearch: function(oEvent) {
			var sFuncLoc = oEvent.getParameter("query");
			var oList = sap.ui.core.Fragment.byId(this._sFragFuncLocId, "FuncLocList");
			var oBinding = oList.getBinding("items");
			if(oBinding){
				if(sFuncLoc) {
					oBinding.filter([
						new sap.ui.model.Filter("FuncLoc", "EQ", sFuncLoc)
					]);
				} else {
					oBinding.filter([]);
				}
			}
		},
		
		/**
		 * Event handler when an item is selected from Barcode Functional Location dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onSelectBarCodeFuncLocVHDialog: function (oEvent) {
			var oThis = this;
			// var aContexts = oEvent.getParameter("selectedContexts");
			var aContexts = oEvent.getSource().getBindingContext().getObject();
			var oModel = this.getModel();
			var sPath = this._currentEntityPath;

			//oModel.setProperty(sPath + "/EqpNo", aContexts.EqpNo);
			//oModel.setProperty(sPath + "/EqpDesc", aContexts.Desc);
			oModel.setProperty(sPath + "/FuncLocId", aContexts.FuncLoc);
			oModel.setProperty(sPath + "/FuncLocDesc", aContexts.Desc);
			oThis._validateSaveEnablement();
			oThis._oBarCodFuncLocDialog.close();
			//this._oBarCodEqpDialog.destroy();
			//return;
		},
		
		/**
		 * Event handler when Cancel is pressed in Barcode Functional Location dialog
		 * @public
		 **/		
		onBarCodeFuncLocVHDialogCancel: function() {
			this._oBarCodFuncLocDialog.close();
		},
		
		/**
		 * Event handler when Equipment Barcode button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onBarCodePressEquip: function (oEvent) {
			var oThis = this;
			
			try {
			    BarcodeScanner.closeScanDialog();
			} catch(oErr) {
				// Error
			}
			
			BarcodeScanner.scan(
				function (mResult) {
					if(!mResult.cancelled) {
						var oDataModel = oThis.getOwnerComponent().getModel();
						var sPlant = oThis.getModel("user").getData().Plant;
						var sValue = mResult.text;
						//var aFilters = new sap.ui.model.Filter("UserPlant", sap.ui.model.FilterOperator.EQ, sPlant);
						var aFilters = [
							new sap.ui.model.Filter("BarCode", "Contains", sValue),
							new sap.ui.model.Filter("UserPlant", "EQ", sPlant)
						];
						
						if (!oThis._oBarCodEqpDialog) {
							oThis._sFragId = oThis.getView().getId() + "idDefaultEquipDialog";
							oThis._oBarCodEqpDialog = sap.ui.xmlfragment(oThis._sFragId, "zpm.e861.wo.ze861notifcreate.view.frags.BarCodeEquip", oThis);
						}
	
						oDataModel.read("/EqpVHSet", {
							filters: [aFilters],
							success: function (oData, oResponse) {
								if (oData.results.length === 1) {
									var oModel = oThis.getModel();
									var sPath = oThis._currentEntityPath;
									var	oDataResults = oData.results[0];
									oModel.setProperty(sPath + "/EqpNo", oDataResults.EqpNo);
									oModel.setProperty(sPath + "/EqpDesc", oDataResults.Desc);
									oModel.setProperty(sPath + "/FuncLocId", oDataResults.FuncLoc);
									oModel.setProperty(sPath + "/FuncLocDesc", oDataResults.FuncLocDesc);
									oThis._validateSaveEnablement();
								} else if (oData.results.length > 1) {
									var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
									oJsonModel.setProperty("/barCode", sValue);
									oThis._oBarCodEqpDialog.setModel(oJsonModel);
									oThis._oBarCodEqpDialog.setModel(oThis.getModel("i18n"), "i18n");
									oThis._oBarCodEqpDialog.open();
									
									// Focus Search Field
							        var oSearchField = sap.ui.core.Fragment.byId(oThis._sFragId, "EqpSearch");
									jQuery.sap.delayedCall(500, null, function() {
							            oSearchField.focus();
							        });
								} else {
									var msg = oThis.getResourceBundle().getText("noResultsFound");
									sap.m.MessageToast.show(msg);
									//console.log("No Results found");
								}
							},
							error: function (oError) {
								var msg = oThis.getResourceBundle().getText("errorSearchingEquipment");
								sap.m.MessageToast.show(msg);
							}
						});
					}
				},
				function (Error) {
					var msg = oThis.getResourceBundle().getText("scanningFailed");
					sap.m.MessageToast.show(msg + ": " + Error);
				}
			);
		},
		
		/**
		 * Event handler when an item is selected from Barcode Equipment dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onSelectBarCodeEquipVHDialog: function (oEvent) {
			var oThis = this;
			// var aContexts = oEvent.getParameter("selectedContexts");
			var aContexts = oEvent.getSource().getBindingContext().getObject();
			var oModel = this.getModel();
			var sPath = this._currentEntityPath;

			oModel.setProperty(sPath + "/EqpNo", aContexts.EqpNo);
			oModel.setProperty(sPath + "/EqpDesc", aContexts.Desc);
			oModel.setProperty(sPath + "/FuncLocId", aContexts.FuncLoc);
			oModel.setProperty(sPath + "/FuncLocDesc", aContexts.Desc);
			oThis._validateSaveEnablement();
			oThis._oBarCodEqpDialog.close();
			//this._oBarCodEqpDialog.destroy();
			//return;
		},
		
		/**
		 * Event handler when search is made in Searchbar in Bar Equipment dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onBarCodeVHEquipDialogSearch: function(oEvent) {
			var sEqp = oEvent.getParameter("query");
			var oList = sap.ui.core.Fragment.byId(this._sFragId, "EquipList");
			var oBinding = oList.getBinding("items");
			if(oBinding){
				if(sEqp) {
					oBinding.filter([
						new sap.ui.model.Filter("EqpNo", "EQ", sEqp)
					]);
				} else {
					oBinding.filter([]);
				}
				
			}
		},
		
		/**
		 * Event handler to destroy Barcode Equipment dialog instance after closing
		 * @public
		 **/		
		onAfterClose: function() {
			this._oBarCodEqpDialog.destroy();
			this._oBarCodEqpDialog = undefined;
		},
		
		/**
		 * Event handler when Cancel is pressed in Barcode Equipment dialog
		 * @public
		 **/		
		onBarCodeEquipVHDialogCancel: function() {
			this._oBarCodEqpDialog.close();
		},
		
		/**
		 * Event handler when Functional Location Hierarchy button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */
		onPressSelectFunctionalLocation: function(oEvnet) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/hierarchyFilter", "FUNCLOC");
			this._openFuncLocHierDialog();
		},
		
		/**
		 * Event handler when Equipment Hierarchy button is pressed
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 */		
		onPressSelectEquipment: function(oEvnet) {
			var oViewModel = this.getModel("view");
			oViewModel.setProperty("/hierarchyFilter", "EQUI");
			this._openFuncLocHierDialog();
		},
		
		/**
		 * Event handler when an item is pressed on Functional Location Hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onPressNavFuncLoc: function(oEvent) {
			var oItem = oEvent.getSource();
			var oNavCon = Fragment.byId("popoverNavCon", "navCon");
			var oMasterPage = Fragment.byId("popoverNavCon", "master");
			
			var sObjectPath = this.getModel().createKey("FuncLocStrucSet", {
				ID :  oItem.getBindingContext().getProperty("ID"),
				Type: oItem.getBindingContext().getProperty("Type")
			});
			
			if(this.bNavBack === false) {
				this.navPaths.push({
					parentId: oItem.getBindingContext().getProperty("ParentID"),
					parentType: oItem.getBindingContext().getProperty("ParentType"),
					parentTypeDesc: oItem.getBindingContext().getProperty("ParentTypeDesc")
				});
			} else {
				this.bNavBack = false;
			}
			
			if(this.navPaths && this.navPaths.length > 0) {
				this.getModel("view").setProperty("/bShowBackButton", true);
			} else {
				this.getModel("view").setProperty("/bShowBackButton", false);
			}
			
			if(oItem.getBindingContext().getProperty("Type") === this.getModel("view").getProperty("/hierarchyFilter")) {
				this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", true);
			} else {
				this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", false);
			}
			oNavCon.to(oMasterPage);
			oMasterPage.bindElement("/" + sObjectPath);
			this._oFuncLocHierNavPopover.focus();
		},
		
		/**
		 * Event handler when Back button is pressed on Functional Location Hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onPressNavBackFuncLoc : function (oEvent) {
			var oNavCon = Fragment.byId("popoverNavCon", "navCon");
			var oMasterPage = Fragment.byId("popoverNavCon", "master");
			var oLastNavPath = this.navPaths.pop();
			if(oLastNavPath) {
				this.bNavBack = true;
				var sObjectPath = this.getModel().createKey("FuncLocStrucSet", {
					ID :  oLastNavPath.parentId,
					Type: oLastNavPath.parentType
				});
				
				if(oLastNavPath.parentType === this.getModel("view").getProperty("/hierarchyFilter")) {
					this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", true);
				} else {
					this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", false);
				}
				
				oNavCon.to(oMasterPage);
				oMasterPage.bindElement("/" + sObjectPath);
				this._oFuncLocHierNavPopover.focus();
			}
			// var oNavCon = Fragment.byId("popoverNavCon", "navCon");
			// oNavCon.back();
		},
		
		/**
		 * Event handler when Select button is pressed on Functional Location Hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onFuncLocHierPopoverAddPress : function (oEvent) {
			var oThis = this;
			// var aMatExists = [];
			// var oNavCon = Fragment.byId("popoverNavCon", "navCon");
			var sPath = this._currentEntityPath;
			// var oList = Fragment.byId("popoverNavCon", "idFuncLocHierList");
			// var aContexts = oList.getSelectedContexts();
			var oModel = this.getModel();
			var oMasterPage = Fragment.byId("popoverNavCon", "master");
			
			var oHier = oMasterPage.getBindingContext().getObject();
			if(this.getModel("view").getProperty("/hierarchyFilter") === "FUNCLOC") {
				oModel.setProperty(sPath + "/FuncLocId", oHier.ID);
			 	oModel.setProperty(sPath + "/FuncLocDesc", oHier.Desc);
			} else {
				oModel.setProperty(sPath + "/EqpNo", oHier.ID);
			 	oModel.setProperty(sPath + "/EqpDesc", oHier.Desc);
			 	oModel.setProperty(sPath + "/FuncLocId", oHier.ParentID);
			 	oModel.setProperty(sPath + "/FuncLocDesc", oHier.ParentIDDesc);
			}
		 	oThis._validateSaveEnablement();
		 	oThis.onFuncLocHierPopoverCancelPress(oEvent);
		},
		
		/**
		 * Event handler when Cancel button is pressed on Functional Location Hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent
		 * @public
		 **/		
		onFuncLocHierPopoverCancelPress: function(oEvent) {
			if (this._oFuncLocHierNavPopover) {
				this._oFuncLocHierNavPopover.close();
				this._oFuncLocHierNavPopover.destroy();
				this._oFuncLocHierNavPopover = null;
			}
		},
		
		/**
		 * Event handler when Clear button is pressed
		 * @public
		 **/		
		onClearPress: function () {
			var oThis = this;
			MessageBox.confirm(
				oThis.getResourceBundle().getText("clearFuncLocAndEqpConfirm"), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: oThis.getResourceBundle().getText("clear"),
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(sAction) {
						if (sAction === sap.m.MessageBox.Action.YES) {
							oThis.getModel().setProperty(oThis._currentEntityPath + "/FuncLocId", "");
							oThis.getModel().setProperty(oThis._currentEntityPath + "/FuncLocDesc", "");
							oThis.getModel().setProperty(oThis._currentEntityPath + "/EqpNo", "");
							oThis.getModel().setProperty(oThis._currentEntityPath + "/EqpDesc", "");
							oThis._validateSaveEnablement();
						}
					}
				}
			);
		},
		
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Checks if the String is a valid string
		 * @private
		 */
		_validateSaveEnablement: function() {
			var oObject = this.getView().getBindingContext().getObject();
			var benableSave = false;
			if(this._isValidObject(oObject.ShortTxt)
				&& this._isValidObject(oObject.Code)
				&& this._isValidObject(oObject.CodeGrp)
				&& this._isValidObject(oObject.Priority) 
				&& (this._isValidObject(oObject.EqpNo) 
				|| this._isValidObject(oObject.FuncLocId))) {
					benableSave = true;
			}
			this.getModel("view").setProperty("/enableSave", benableSave);
			if(benableSave){
				this._checkForErrorMessages();
			}
		},
		
		/**
		 * Checks if the String is a valid string
		 * @private
		 */
		_isValidObject: function(sValue) {
			if (sValue && sValue !== "" && sValue !== null && sValue !== undefined) {
				return true;
			}
			return false;
		},
		
		/**
		 * Checks if there is any wrong inputs that can not be saved.
		 * @private
		 */
		_checkForErrorMessages: function() {
			var aMessages = this._oBinding.oModel.oData;
			if (aMessages.length > 0) {
				var benableSave = true;
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						benableSave = false;
						break;
					}
				}
				this.getModel("view").setProperty("/enableSave", benableSave);
			} else {
				this.getModel("view").setProperty("/enableSave", true);
			}
		},
		
		/**
		 * Submits the changes to the backend including the attachments
		 * @private
		 */		
		_post: function (bSaveAndStart) {
			var oThat = this,
				oModel = this.getModel();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();
			
			if(bSaveAndStart){
				this.getModel().setProperty(this._currentEntityPath + "/StartWOFlg", "X");
			}

			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				sap.m.MessageBox.information(
					this.getResourceBundle().getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: oThat.getOwnerComponent().getContentDensityClass()
					}
				);
				return;
			}
			this.getModel("appView").setProperty("/busy", true);
			// attach to the request completed event of the batch
			oModel.attachEventOnce("batchRequestCompleted", function (oEvent) {
				var oParams = oEvent.getParameters();
				var aRequests = oEvent.getParameters().requests;
				var bCompact = !!oThat.getView().$().closest(".sapUiSizeCompact").length;
				var oRequest;

				if (oParams.success) {
					if (aRequests) {
						for (var i = 0; i < aRequests.length; i++) {
							oRequest = oEvent.getParameters().requests[i];
							var oResponseHeader = oRequest.response.headers;
							var sCode = oResponseHeader.returncode;
							
							if(sCode === "000"){
								MessageBox.error(
									oResponseHeader.returnmsg/*sapMessage.message*/,	{
										styleClass: bCompact ? "sapUiSizeCompact" : ""
									}
								);
								oThat._fnEntityCreationFailed();
								return;
							} else if(sCode === "100"){
								oThat.getModel("view").setProperty("/sNewNotificationNo", oResponseHeader.returnnotif);
								oThat.onStartAttachmentsUpload();
								MessageBox.success(
									oResponseHeader.returnmsg/*sapMessage.message*/,	{
										styleClass: bCompact ? "sapUiSizeCompact" : "",
										actions: ["Show", MessageBox.Action.OK],
										emphasizedAction: "OK",
										initialFocus: "OK",
										onClose: function (sAction) {
											if(sAction === "Show") {
												oThat._navToNotificationDetails(oResponseHeader.returnnotif);
												return;
											}
											oThat._navToNotificationList();
										}
									}
								);
								return;
							}
							
							if (!oRequest.success) {
								oThat._fnEntityCreationFailed();
								return;
							}
						}
					}
					// oThat._fnUpdateSuccess();
				} else {
					oThat._fnEntityCreationFailed();
					// return false;
				}
				// if (oThat._checkIfBatchRequestSucceeded(oEvent)) {
				// 	oThat._fnUpdateSuccess();
				// } else {
				// 	oThat._fnEntityCreationFailed();
				// 	// sap.m.MessageBox.error(oThat.getResourceBundle().getText("updateError"));
				// }
			});
			oModel.submitChanges();
		},
		
		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_navToNotificationList: function () {
			this.getModel("appView").setProperty("/busy", false);
			
			// this._oNewNotificationContext = this.getModel().createEntry("NotificationSet");
			// this.getView().setBindingContext(this._oNewNotificationContext);
			this.getModel("view").setProperty("/enableSave", false);
			
			sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
			    target : {semanticObject : "ZMyNotification", action : "display"}
			});
			
		},
		
		/**
		 * Navigates to My Notifications app
		 * @private
		 */		
		_navToNotificationDetails: function (sOrderNo) {
			this.getModel("appView").setProperty("/busy", false);
			
			// this._oNewNotificationContext = this.getModel().createEntry("NotificationSet");
			// this.getView().setBindingContext(this._oNewNotificationContext);
			this.getModel("view").setProperty("/enableSave", false);
			
			sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
			    target : {semanticObject : "ZMyNotification", action : "display"},
			    params : {"orderNo" : sOrderNo}
			});
			
		},
		
		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function () {
			this.getModel("appView").setProperty("/busy", false);
			
			this._oNewNotificationContext = this.getModel().createEntry("NotifSet", {
				properties: this._oCurrentEntity
			});
			this.getView().setBindingContext(this._oNewNotificationContext);
			this.getModel("view").setProperty("/enableSave", true);
		},
		
		/**
		 * Add Functioanl Location/Equipment from Hierarchy
		 * @private
		**/
		_openFuncLocHierDialog: function() {
			var oWorkOrder = this.getView().getBindingContext().getObject();
			this.getModel("view").setProperty("/bShowBackButton", false);
			this.bNavBack = false;
			var oThis = this;
			if (!this._oFuncLocHierNavPopover) {
				Fragment.load({
					id: "popoverNavCon",
					name: "zpm.e861.wo.ze861notifcreate.view.frags.FuncLocHierNavPopover",
					controller: this
				}).then(function(oPopover){
					this._oFuncLocHierNavPopover = oPopover;
					var sObjectPath = this.getModel().createKey("FuncLocStrucSet", {
						ID :  oWorkOrder.Plant,
						Type: "FUNCLOC"
					});
					this._oFuncLocHierNavPopover.setModel(this.getView().getModel());
					this._oFuncLocHierNavPopover.setModel(this.getView().getModel("view"), "view");	
					this._oFuncLocHierNavPopover.setModel(this.getView().getModel("device"), "device");	
					this._oFuncLocHierNavPopover.setModel(this.getView().getModel("i18n"), "i18n");	
					this._oFuncLocHierNavPopover.bindElement({
						path: "/" + sObjectPath,
						events: {
							dataRequested: function () {
								oThis._oFuncLocHierNavPopover.setBusy(true);
							},
							dataReceived: function () {
								oThis._oFuncLocHierNavPopover.setBusy(false);
							}
						}
					});
					this.getView().addDependent(this._oFuncLocHierNavPopover);
					if("FUNCLOC" === this.getModel("view").getProperty("/hierarchyFilter")) {
						this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", true);
					} else {
						this.getModel("view").setProperty("/bFuncHierPopoverAddButtonVisibility", false);
					}
					this._oFuncLocHierNavPopover.open();
				}.bind(this));
			} else {
				this._oFuncLocHierNavPopover.open();
			}
		}
	});
});