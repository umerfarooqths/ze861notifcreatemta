sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library"
], function (Controller, UIComponent, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("zpm.e861.wo.ze861notifcreate.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress : function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		* Adds a history entry in the FLP page history
		* @public
		* @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
		* @param {boolean} bReset If true resets the history before the new entry is added
		*/
		addHistoryEntry: (function() {
			var aHistoryEntries = [];

			return function(oEntry, bReset) {
				if (bReset) {
					aHistoryEntries = [];
				}

				var bInHistory = aHistoryEntries.some(function(oHistoryEntry) {
					return oHistoryEntry.intent === oEntry.intent;
				});

				if (!bInHistory) {
					aHistoryEntries.push(oEntry);
					this.getOwnerComponent().getService("ShellUIService").then(function(oService) {
						oService.setHierarchy(aHistoryEntries);
					});
				}
			};
		})(),
		
		/* =========================================================== */
		/* Methods for handling Upload Collection                      */
		/* =========================================================== */
		
		/**
		 * Event handler for before attachment upload starts
		 * @param {sap.ui.base.Event} oEvent the beforeUploadStart event
		 * @public
		 **/
		onBeforeUploadAttachmentsStarts: function(oEvent) {
			// var oWorkOrder = this.getView().getBindingContext().getObject();
			var sObjectPath = this.getView().getModel("view").getProperty("/sNewNotificationNo") + "/NOTIF/";

			this.onPrepareAttachmentsHeader(oEvent, sObjectPath);
		},
		
		/**
		 * Event handler for attachment upload change
		 * @public
		 * @param {sap.ui.base.Event} oEvent: the change event
		 **/
		onUploadAttachmentsChange: function(oEvent) {
			var oUploadCollection = oEvent.getSource();

			this.getModel("view").setProperty("/uploadAttachmentCount", oUploadCollection.getItems().length + oEvent.getParameters().files.length);
		},

		/**
		 * Event handler for attachment upload when filetype, name, or size mismatch
		 * @public
		 **/
		onUploadAttachmentMismatch: function() {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var sMsg = this.getResourceBundle().getText("uploadAttachmentMismatch_MsgText", [
				"All", 		
				// "pdf", 		
				 "All",
				 50,
				 50
			]);

			sap.m.MessageBox.error(
				sMsg, {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		},

		/**
		 * Event handler to prepare the header for attachments upload call
		 * @param {sap.ui.base.Event} oEvent: the before upload attachment starts event 
		 * @param {string} sObjectPath: the path to which the attachments are to be uploaded
		 * @public
		 **/
		onPrepareAttachmentsHeader: function(oEvent, sObjectPath) {
			var oModel = this.getView().getModel();
			oModel.refreshSecurityToken();
			var token = oModel.getHeaders()["x-csrf-token"];

			// Set Header Token
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: token
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);

			// Set Header Slug
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: sObjectPath + oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

			sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsUploadStarting_MsgText"));
		},

		/**
		 * Event handler when attachment(s) uploaded started
		 * @public
		 * @param {sap.ui.base.Event} oEvent: start upload event
		 **/
		onStartAttachmentsUpload: function(oEvent) {
			var oUploadCollection = this.getView().byId("idUploadCollection");
			var cFiles = oUploadCollection.getItems().length;
			var sUploadInfo = "";

			if (oUploadCollection.getItems().length > 0) {
				oUploadCollection.upload();
				sUploadInfo = cFiles + " " + this.getResourceBundle().getText("files");
				sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsUploadStarted_MsgText", [sUploadInfo]));
			}
		},

		/**
		 * Event handler for attachment upload terminated
		 * @public
		 * @param {sap.ui.base.Event} oEvent: the terminated event
		 **/
		onUploadAttachmentsTerminated: function(oEvent) {
			sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsUploadTerminated_MsgText"));
		},

		/**
		 * Event handler when attachment(s) upload completed
		 * @public
		 * @param {sap.ui.base.Event} oEvent: the upload complete event
		 **/
		onUploadAttachmentsComplete: function(oEvent) {
			sap.m.MessageToast.show(this.getResourceBundle().getText("attachmentsUploadCompleted_MsgText"));
			// var oAttachmentList = this.byId("idUploadCollection");
			// if(oAttachmentList){
			//   	oAttachmentList.getBinding("items").refresh();
			// }
		},
		
		/**
		 * Event handler for deleting an attachment
		 * @public
		 * @param {sap.ui.base.Event} oEvent the button press event
		**/
		onUploadAttachmentsDeleted: function(oEvent) {
			var oUploadCollection = oEvent.getSource();

			this.getModel("view").setProperty("/uploadAttachmentCount", oUploadCollection.getItems().length);
		}

	});

});