var Service, Characteristic, Accessory;
var exec2 = require("child_process").exec;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Accessory = homebridge.hap.Accessory;
    //UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory('homebridge-samsung-airconditioner-specialmode', 'SamsungAirconditionerspecialmode', SamsungAirco);
}

function SamsungAirco(log, config) {
    this.log = log;
    this.name = config["name"];
    this.ip = config["ip"];
    this.token = config["token"];
    this.patchCert = config["patchCert"];
}

SamsungAirco.prototype = {

    execRequest: function(str, body, callback) {
        exec2(str, function(error, stdout, stderr) {
            callback(error, stdout, stderr)
        })
        //return stdout;
    },
    identify: function(callback) {
        this.log("장치 확인됨");
        callback(); // success
    },

    getServices: function() {

        //var uuid;
        //uuid = UUIDGen.generate(this.accessoryName);
        this.aircoSamsung = new Service.Switch(this.name);

        //전원 설정
        this.aircoSamsung.getCharacteristic(Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this));


        var informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung')
            .setCharacteristic(Characteristic.Model, 'Air conditioner SW')
            .setCharacteristic(Characteristic.SerialNumber, 'AF18M9970GFK');


        return [informationService, this.aircoSamsung];
    },

    //services

    getOn: function(callback) {
        var str;
        var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Operation.power\'';


        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
                body = body.substr(1, body.length - 3);
                if (body == "Off") {
                    callback(null, Characteristic.On.powerOff);
                    //this.log("비활성화 확인");
                } else if (body == "On") {
                    //this.log("활성화 확인");
                    callback(null, Characteristic.On.powerOn);
                } else
                    this.log("활성화 확인 오류");
            }
        }.bind(this));
    },

    setOn: function(state, callback) {

        switch (state) {

            case Characteristic.On.powerOn:
                var str;
                var body;
                //this.log("켜기 설정");
                str = 'curl -X PUT -d \'{"Operation": {"power" : "On"}}\'curl -X PUT -d \'{"options": ["Comode_Speed"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case Characteristic.On.powerOff:
                var str;
                var body;
                //this.log("끄기 설정");
                str = 'curl -X PUT -d \'{"Operation": {"power" : "Off"}}\'curl -X PUT -d \'{"options": ["Comode_off"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;
        }
    }
}
