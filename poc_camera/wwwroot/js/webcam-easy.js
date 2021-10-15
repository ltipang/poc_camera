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
class Webcam {
    constructor(webcamElement, facingMode = 'user', canvasElement = null, snapSoundElement = null) {
      this._webcamElement = webcamElement;
      this._webcamElement.width = this._webcamElement.width || getWidth();
      this._webcamElement.height = this._webcamElement.height || (getWidth() * 16 / 9);
      this._facingMode = facingMode;
      this._webcamList = [];
      this._streamList = [];
      this._selectedDeviceId = '';
      this._canvasElement = canvasElement;
      this._snapSoundElement = snapSoundElement;
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
      mediaDevices.forEach(mediaDevice => {
        if (mediaDevice.kind === 'videoinput') {
          this._webcamList.push(mediaDevice);
        }
      });
      if(this._webcamList.length == 1){
        this._facingMode = 'user';
      }    
      return this._webcamList;
    }

    /* Get media constraints */
    getMediaConstraints() {
        var videoConstraints = {            
            width: {
                min: 1920,
                ideal: 1920,
                max: 2560,
            },
            height: {
                min: 1080,
                ideal: 1080,
                max: 1440
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
    selectCamera(){
      for(let webcam of this._webcamList){
        if(   (this._facingMode=='user' && webcam.label.toLowerCase().includes('front'))
          ||  (this._facingMode=='enviroment' && webcam.label.toLowerCase().includes('back'))
        )
        {
          this._selectedDeviceId = webcam.deviceId;
          break;
        }
      }
    }

    /* Change Facing mode and selected camera */ 
    flip(){
      this._facingMode = (this._facingMode == 'user')? 'enviroment': 'user';
      this._webcamElement.style.transform = "";
      this.selectCamera();  
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
              .then(webcams =>{
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
          
          var screenWidth = getWidth();
          var screenHeight = getHeight();
          var videoWidth = this._webcamElement.videoWidth;
          var videoHeight = this._webcamElement.videoHeight;
        
          var ratio = screenWidth / videoWidth;
          var realVideoHeight = videoHeight * ratio;
          var sx = videoWidth / 2 - (0.5 - mask_x) * screenWidth / ratio / zoom;
          var sy = videoHeight / 2 - (0.5 - mask_y) * screenHeight / ratio / zoom;
         
          var sWidth = videoWidth * mask_w / zoom;
          var sHeight = screenHeight * mask_h / ratio / zoom;
          if (sy < 0) sy = 0;

          this._canvasElement.width = sWidth;
          this._canvasElement.height = sHeight;

        let context = this._canvasElement.getContext('2d');
        if(this._facingMode == 'user'){
          context.translate(this._canvasElement.width, 0);
          context.scale(-1, 1);
          }

          context.width = this._canvasElement.width;
          context.height = this._canvasElement.height;
          //context.clearRect(0, 0, this._canvasElement.width, this._canvasElement.height);
          context.drawImage(this._webcamElement, sx, sy, sWidth, sHeight, 0, 0, context.width, context.height);
        let data = this._canvasElement.toDataURL('image/png');
        return data;
      }
      else{
        throw "canvas element is missing";
      }
    } 
}