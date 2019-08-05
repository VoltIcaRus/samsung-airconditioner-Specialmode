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
        this.aircoSamsung = new Service.HeaterCooler(this.name);

        //전원 설정
        this.aircoSamsung.getCharacteristic(Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        //현재 온도
        this.aircoSamsung.getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                minValue: 0,
                maxValue: 50,
                minStep: 1
            })
            .on('get', this.getCurrentTemperature.bind(this));

        //현재 모드 설정
        this.aircoSamsung.getCharacteristic(Characteristic.TargetHeaterCoolerState)
            .on('get', this.getTargetHeaterCoolerState.bind(this))       
            .on('set', this.setTargetHeaterCoolerState.bind(this));
   
        //현재 모드 확인
        this.aircoSamsung.getCharacteristic(Characteristic.CurrentHeaterCoolerState) 
            .on('get', this.getCurrentHeaterCoolerState.bind(this));

        //냉방모드 온도
        this.aircoSamsung.getCharacteristic(Characteristic.CoolingThresholdTemperature)
            .setProps({
                minValue: 18,
                maxValue: 30,
                minStep: 1
            })
            .on('get', this.getTargetTemperature.bind(this))
            .on('set', this.setTargetTemperature.bind(this)); 

        //난방모드 온도        
         this.aircoSamsung.getCharacteristic(Characteristic.HeatingThresholdTemperature)
            .setProps({
                minValue: 18,
                maxValue: 30,
                minStep: 1
            })
            .on('get', this.getTargetTemperature.bind(this))
            .on('set', this.setTargetTemperature.bind(this)); 
        
        //스윙모드 설정
        this.aircoSamsung.getCharacteristic(Characteristic.SwingMode)
            .on('get', this.getSwingMode.bind(this))
            .on('set', this.setSwingMode.bind(this));  

        //자동청소 설정
        this.aircoSamsung.getCharacteristic(Characteristic.LockPhysicalControls)
            .on('get', this.getLockPhysicalControls.bind(this))
            .on('set', this.setLockPhysicalControls.bind(this));  
	    
	    
        //바람세기 설정        
        this.aircoSamsung.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                minValue: 0,
                maxValue: 5,
                minStep: 1,
            })
            .on('get', this.getRotationSpeed.bind(this))
            .on('set', this.setRotationSpeed.bind(this));
		
        var informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung')
            .setCharacteristic(Characteristic.Model, 'Air conditioner sw')
            .setCharacteristic(Characteristic.SerialNumber, 'AF18M9970GFK');
	    
	    
        return [informationService, this.aircoSamsung];
    },

    //services

    getTargetTemperature: function(callback) {
        var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Temperatures[0].desired\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = parseInt(stdout);
                callback(null, body);
                //this.log("희망온도 확인 : " + body);
            }
        }.bind(this))
    },

    setTargetTemperature: function(body, callback) {
	var str;
	var body;
        str = 'curl -X PUT -d \'{"desired": ' + body + '}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/temperatures/0';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                callback();
                //this.log("희망온도 설정 : " + body);
            }
        }.bind(this));
    },
    
    getCurrentTemperature: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Temperatures[0].current\'';
 
        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = parseInt(stdout);
                callback(null, body);
                //this.log("현재 온도: " + body);
            }
        }.bind(this));
    },

    getRotationSpeed: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Wind.speedLevel\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = parseInt(stdout);
            if (body == 0) {
                callback(null, 2);
                //this.log("자동풍 확인");
            } else if (body == 2 || body == 3 || body == 4) {
                //this.log("미풍 등 확인");
                callback(null, 1);
            } else
		this.log("풍속 확인 오류");
            }
        }.bind(this));
    },
    
    setRotationSpeed: function(state, callback) {

        switch (state) {

            case 5:
	        var str;
	        var body;
                //this.log("터보풍 설정")
                str = 'curl -X PUT -d \'{"speedLevel": 4}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
 
	        this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case 4:
	        var str;
	        var body;
                //this.log("강풍 설정")
                str = 'curl -X PUT -d \'{"speedLevel": 3}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';

                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break; 
			
            case 3:
	        var str;
	        var body;
                //this.log("미풍 설정")
                str = 'curl -X PUT -d \'{"speedLevel": 1}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
 
	        this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

	    case 2:
	        var str;
	        var body;
                //this.log("자동풍 설정")
                str = 'curl -X PUT -d \'{"speedLevel": 0}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/wind';
 
	        this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

        }
    },
    
    getLockPhysicalControls: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Mode.options[3]\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
            if (body == "Autoclean_Off") {
                callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
                //this.log("자동청소해제 확인");
            } else if (body == "Autoclean_On") {
                //this.log("자동청소 확인");
                callback(null, Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);
            } else
                this.log("자동청소 확인 오류");
            }
        }.bind(this));
    },
    
    setLockPhysicalControls: function(state, callback) {

        switch (state) {

            case Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED:
	        var str;
	        var body;
                //this.log("자동청소 설정")
                str = 'curl -X PUT -d \'{"options": ["Autoclean_On"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';

                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED:
	        var str;
	        var body;
                //this.log("자동청소해제 설정")
                str = 'curl -X PUT -d \'{"options": ["Autoclean_Off"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
 
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;
        }
    },
	
    getSwingMode: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Mode.options[1]\'';

        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
            if (body == "Comode_Off" || body == "Comode_Speed" || body == "Comode_Quiet" || body == "Comode_Sleep") {
                callback(null, Characteristic.SwingMode.SWING_DISABLED);
                //this.log("무풍모드해제 확인");
            } else if (body == "Comode_Nano" || body == "Comode_NanoSleep") {
                //this.log("무풍모드 확인");
                callback(null, Characteristic.SwingMode.SWING_ENABLED);
            } else
		this.log("무풍모드 확인 오류");
            }
        }.bind(this));
    },
    
    setSwingMode: function(state, callback) {

        switch (state) {

            case Characteristic.SwingMode.SWING_ENABLED:
	        var str;
	        var body;
                //this.log("무풍모드 설정")
                str = 'curl -X PUT -d \'{"options": ["Comode_Nano"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';

                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case Characteristic.SwingMode.SWING_DISABLED:
	        var str;
	        var body;
                //this.log("무풍모드해제 설정")
                str = 'curl -X PUT -d \'{"options": ["Comode_Off"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
 
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;
        }
    },
    
    getActive: function(callback) {
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
                callback(null, Characteristic.Active.INACTIVE);
                //this.log("비활성화 확인");
            } else if (body == "On") {
                //this.log("활성화 확인");
                callback(null, Characteristic.Active.ACTIVE);
            } else
		this.log("활성화 확인 오류");
            }
        }.bind(this));
    },
	
    setActive: function(state, callback) {

        switch (state) {

            case Characteristic.Active.ACTIVE:
	        var str;
	        var body;
                //this.log("켜기 설정");
                str = 'curl -X PUT -d \'{"Operation": {"power" : "On"}}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0';
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case Characteristic.Active.INACTIVE:
	        var str;
	        var body;
                //this.log("끄기 설정");
                str = 'curl -X PUT -d \'{"options": {"Comode_Off"}}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;
         }
    },

    getCurrentHeaterCoolerState: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Mode.modes[0]\'';
 
        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
                if (body == "CoolClean" || body == "Cool") {
                    //this.log("냉방청정모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
                } else if (body == "Wind" || body == "DryClean" || body == "Dry") {
                    //this.log("공기청정 제습모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.HEATING);
                } else if (body == "Auto" || body == "Auto") {
                   // this.log("스마트쾌적모드 확인");
                    callback(null, Characteristic.CurrentHeaterCoolerState.IDLE);
                } else
		    this.log("현재 모드 확인 오류");      
            }
        }.bind(this));
    },
   	getCurrentHeaterCoolerState: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Mode.options[1]\'';
 
        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
                if (body == "Comode_Off") {
                    //this.log("특수운전모드해제 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
                } else if (body == "Comode_Speed") {
                    //this.log("스피드모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
                } else if (body == "Comode_Quiet") {
                   // this.log("정숙모드 확인");
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
		} else if (body == "Comode_Sleep") {
                    //this.log("열대아쾌면모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
		} else if (body == "Comode_Nano") {
                    //this.log("무풍모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
		} else if (body == "Comode_NanoSleep") {
                    //this.log("열대야쾌면무풍모드 확인");                	
                    callback(null, Characteristic.CurrentHeaterCoolerState.COOLING);
                } else
		    this.log("특수 모드 확인 오류");      
            }
        }.bind(this));
    },
	
     getTargetHeaterCoolerState: function(callback) {
	var str;
	var body;
        str = 'curl -s -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure -X GET https://' + this.ip + ':8888/devices|jq \'.Devices[1].Mode.modes[0]\'';
 
        this.execRequest(str, body, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                body = stdout;
	        body = body.substr(1, body.length - 3);
                if (body == "CoolClean" || body == "Cool") {
                    //this.log("냉방청정모드 확인");                	
                    callback(null, Characteristic.TargetHeaterCoolerState.COOL);
                } else if (body == "Wind" || body == "Wind") {
                    //this.log("공기청정모드 확인");                	
                    callback(null, Characteristic.TargetHeaterCoolerState.HEAT);
                } else if (body == "Auto" || body == "Auto") {
                    //this.log("스마트쾌적모드 확인");
                    callback(null, Characteristic.TargetHeaterCoolerState.AUTO);
                } else
		    this.log("목표 모드 확인 오류");      
            }
        }.bind(this));
    },
    
    setTargetHeaterCoolerState: function(state, callback) {

        switch (state) {

            case Characteristic.TargetHeaterCoolerState.AUTO:
	        var str;
	        var body;
                //this.log("스피드운전 설정");
                str = 'curl -X PUT -d \'{"options": ["Comode_Speed"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.aircoSamsung.getCharacteristic(Characteristic.CurrentHeaterCoolerState).updateValue(1);
			
	    this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;

            case Characteristic.TargetHeaterCoolerState.HEAT:
	        var str;
	        var body;
                //this.log("정숙모드로 설정");
                str = 'curl -X PUT -d \'{"options": ["Comode_Quiet"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.aircoSamsung.getCharacteristic(Characteristic.CurrentHeaterCoolerState).updateValue(2);
			
                this.execRequest(str, body, function(error, stdout, stderr) {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                }.bind(this));
                break;
                
            case Characteristic.TargetHeaterCoolerState.COOL:
	        var str;
	        var body;
                //this.log("한시간반 슬립 설정");
                str = 'curl -X PUT -d \'{"options": ["Sleep_3"]}\' -v -k -H "Content-Type: application/json" -H "Authorization: Bearer ' + this.token + '" --cert ' + this.patchCert + ' --insecure https://' + this.ip + ':8888/devices/0/mode';
                this.aircoSamsung.getCharacteristic(Characteristic.CurrentHeaterCoolerState).updateValue(3);
			
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
