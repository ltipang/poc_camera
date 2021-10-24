function getWidth() {
    xWidth = null;
    if (window.screen != null)
        xWidth = window.screen.availWidth;

    if (window.innerWidth != null)
        xWidth = window.innerWidth;

    if (document.body != null)
        xWidth = document.body.clientWidth;

    return xWidth;
}

function getHeight() {
    xHeight = null;
    if (window.screen != null)
        xHeight = window.screen.availHeight;

    if (window.innerHeight != null)
        xHeight = window.innerHeight;


    return xHeight;
}

const img_width = 1170.0; // 750.0
const img_height = 2037.0; // 1334.0
var mask_x = 103.0;// / img_width;
var mask_y = 733.0; // / img_height;
var mask_w = 965;// / img_width;
var mask_h = 395; // / img_height;

var screenWidth = getWidth();
var screenHeight = getHeight();

// calculate mask //
var screenRatio = screenHeight / screenWidth;
if (screenRatio > img_height / img_width) {
    var szoom = screenHeight / img_height;
    mask_w *= szoom;
    mask_h *= szoom;
    mask_x *= szoom;
    mask_y *= szoom;
    var offset_x = (img_width * szoom - screenWidth) / 2.0;
    mask_x = (mask_x - offset_x) / screenWidth;
    mask_w /= screenWidth;
    mask_y /= screenHeight;
    mask_h /= screenHeight;

}
else {
    var szoom = screenWidth / img_width;
    mask_w *= szoom;
    mask_h *= szoom;
    mask_x *= szoom;
    mask_y *= szoom;
    var offset_y = (img_height * szoom - screenHeight) / 2.0;
    mask_x /= screenWidth;
    mask_w /= screenWidth;
    mask_y = (mask_y - offset_y) / screenHeight;
    mask_h /= screenHeight;
}
/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

class Webcam {
    constructor(webcamElement, facingMode = 'environment', canvasElement = null, snapSoundElement = null) {
        this._webcamElement = webcamElement;
        this._webcamElement.width = this._webcamElement.width || getWidth();
        this._webcamElement.height = this._webcamElement.height || getHeight(); //(getWidth() * 16 / 9);
        this._facingMode = facingMode;
        this._webcamList = [];
        this._streamList = [];
        this._selectedDeviceId = '';
        this._canvasElement = canvasElement;
        this._snapSoundElement = snapSoundElement;
        this._selectedNo = 0;
        this._osType = getMobileOperatingSystem();


    }

    get facingMode(){
      return this._facingMode;
    }

    set facingMode(value){
      this._facingMode = value;
    }

    get webcamList(){
      return this._webcamList;
    }

    get webcamCount(){
      return this._webcamList.length;
    }

    get selectedDeviceId(){
      return this._selectedDeviceId;
    }

    /* Get all video input devices info */
    getVideoInputs(mediaDevices){
        this._webcamList = [];
        var ind = 0;
      mediaDevices.forEach(mediaDevice => {
          if (mediaDevice.kind === 'videoinput') {
              ind++;
              if (this._osType === 'Android') {
                  if (mediaDevice.label.toLowerCase().includes('back')) {
                      this._webcamList.push(mediaDevice);
                  }
              }
              else if (this._osType === 'iOS') {
                  if (ind > 1) {
                      this._webcamList.push(mediaDevice);
                  }
              }
              else {
                  this._webcamList.push(mediaDevice);          
              }        
          }
      });
      if(this._webcamList.length == 1){
          this._facingMode = 'environment';
      }    
      return this._webcamList;
    }

    /* Get media constraints */
    getMediaConstraints() {
        var videoConstraints = {            
           width: {
                min: 1280,
                ideal: 1920,
                max: 3940,
            },
            height: {
                min: 720,
                ideal: 1080,
                max: 2160
            }
        };
        if (this._selectedDeviceId == '') {
            videoConstraints.facingMode =  this._facingMode;
        } else {
            videoConstraints.deviceId = { exact: this._selectedDeviceId};
        }
        var constraints = {
            video: videoConstraints,
            audio: false
        };
        return constraints;
    }

    /* Select camera based on facingMode */ 
    selectCamera() {
        if (this._webcamList.length == 0)
            return;
       /* var res = '';
        this._webcamList.forEach(webcam => {
            res += webcam.label;
        });
        $('#results').text(res);*/
        if (this._selectedNo >= this._webcamList.length)
            this._selectedNo = 0;
        this._selectedDeviceId = this._webcamList[this._selectedNo].deviceId;
 

    }

    /* Change Facing mode and selected camera */ 
    flip(){
        this._facingMode = (this._facingMode == 'user') ? 'environment' : 'user';
        this._selectedNo += 1;
        this._webcamElement.style.transform = "";
        this.selectCamera();   //select camera based on facingMode
    }

    /*
      1. Get permission from user
      2. Get all video input devices info
      3. Select camera based on facingMode 
      4. Start stream
    */
    async start(startStream = true) {
      return new Promise((resolve, reject) => {         
          this.stop();
            navigator.mediaDevices.getUserMedia(this.getMediaConstraints()) //get permisson from user
          .then(stream => {
            this._streamList.push(stream);
            this.info() //get all video input devices info
                .then(webcams => {
                    if (this._webcamList.length > 0 && this._osType === 'iOS') this._selectedNo = this._webcamList.length - 1;
                    //if (this._webcamList.length > 2 && this._osType === 'Android') this._selectedNo = this._webcamList.length - 2;
                    this.selectCamera();   //select camera based on facingMode
                    if(startStream){
                        this.stream()
                            .then(facingMode =>{
                                resolve(this._facingMode);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    }else{
                        resolve(this._selectedDeviceId);
                    }
                }) 
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
              reject(error);
          });
      });
    }

    /* Get all video input devices info */ 
    async info(){
      return new Promise((resolve, reject) => {            
        navigator.mediaDevices.enumerateDevices()
          .then(devices =>{
            this.getVideoInputs(devices);
            resolve(this._webcamList);
          }) 
          .catch(error => {
            reject(error);
          });
      });
    }
  
    /* Start streaming webcam to video element */ 
    async stream() {
      return new Promise((resolve, reject) => {         
        navigator.mediaDevices.getUserMedia(this.getMediaConstraints())
          .then(stream => {
              this._streamList.push(stream);
              this._webcamElement.srcObject = stream;
              if(this._facingMode == 'user'){
                this._webcamElement.style.transform = "scale(-1,1)";
              }
              this._webcamElement.play();
              resolve(this._facingMode);
          })
          .catch(error => {
              console.log(error);
              reject(error);
          });
      });
    }

    /* Stop streaming webcam */ 
    stop() {
      this._streamList.forEach(stream => {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      });   
    }

    snap() {
          if(this._canvasElement!=null){
                if(this._snapSoundElement!= null){
                  this._snapSoundElement.play();
                }
          
                

                var videoWidth = this._webcamElement.videoWidth;
                var videoHeight = this._webcamElement.videoHeight;
        
                var ratio = screenWidth / videoWidth;
                var realVideoHeight = videoHeight * ratio;
                var sx = videoWidth / 2 - (0.5 - mask_x) * screenWidth / ratio / zoom;
                var sy = videoHeight / 2 - (0.5 - mask_y) * screenHeight / ratio / zoom;
         
                var sWidth = videoWidth * mask_w / zoom;
                var sHeight = screenHeight * mask_h / ratio / zoom;
                if (sy < 0) sy = 0;

                this._canvasElement.width = 320;
                this._canvasElement.height = 130;

                let context = this._canvasElement.getContext('2d');
                if(this._facingMode == 'user'){
                    context.translate(this._canvasElement.width, 0);
                    context.scale(-1, 1);
                }

                context.width = this._canvasElement.width;
                context.height = this._canvasElement.height;
                //context.clearRect(0, 0, this._canvasElement.width, this._canvasElement.height);
                context.drawImage(this._webcamElement, sx, sy, sWidth, sHeight, 0, 0, context.width, context.height);
                let cropped = this._canvasElement.toDataURL('image/png');

                context.clearRect(0, 0, context.width, context.height);
                this._canvasElement.width = videoWidth;
                this._canvasElement.height = videoHeight;
                context.drawImage(this._webcamElement, 0, 0, videoWidth, videoHeight, 0, 0, videoWidth, videoHeight);
                let image = this._canvasElement.toDataURL('image/png');

                return { image, cropped };
          }
          else{
            throw "canvas element is missing";
          }
    } 
}