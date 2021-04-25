sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/base/util/ObjectPath"
], function (JSONModel, Device, ObjectPath) {
	"use strict";

	return {

		createDeviceModel : function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createFLPModel : function (oComponent) {
			var fnGetUser = ObjectPath.get("sap.ushell.Container.getUser"),
				bIsShareInJamActive = fnGetUser ? fnGetUser().isJamActive() : false,
				oModel = new JSONModel({
					isShareInJamActive: bIsShareInJamActive,
					mode: ""
				});
				
			if(oComponent.getComponentData()) {
				if(oComponent.getComponentData().startupParameters){
					if(oComponent.getComponentData().startupParameters.mode !== undefined) {
						oModel.setProperty("/mode", oComponent.getComponentData().startupParameters.mode[0]);
					}
				}
			}
			
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}
	};
});