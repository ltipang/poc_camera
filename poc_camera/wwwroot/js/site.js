// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

function detectWebcam(callback) {
    let md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return callback(false);
    md.enumerateDevices().then(devices => {
        callback(true);//devices.some(device => 'videoinput' === device.kind));
    })
}

detectWebcam(function (hasWebcam) {
    if (!hasWebcam) {
       document.getElementById("link-cam").style.display = "none";
    }
});

if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
    console.log("Let's get this party started")
}
else {
    //document.getElementById("link-cam").style.display = "none";
}



const webcamElement = document.getElementById('webcam');

const canvasElement = document.getElementById('canvas');

const snapSoundElement = document.getElementById('snapSound');

const webcam = new Webcam(webcamElement, 'enviroment', canvasElement, snapSoundElement);

var slider = document.getElementById("myRange");
var zoom = 1.0;
slider.oninput = function () {
    zoom = 1.0 + (this.value - 50) / 50.0;

    webcamElement.style['transform'] = 'scale( ' + zoom + ', ' + zoom + ')';
}

const img_width = 750.0
const img_height = 1334.0
const mask_x = 70 / img_width;
const mask_y = 500 / img_height;
const mask_w = 620 / img_width;
const mask_h = 295 / img_height;
//var ctx = canvasElement.getContext('2d');

//setInterval(function () {
//    ctx.drawImage(webcamElement, 0, 0, 300, 550);
 //   }, 20); 

function startCamera() {
    $('.md-modal').addClass('md-show');
    webcam.start()
        .then(result => {
            cameraStarted();
            console.log("webcam started");
        })
        .catch(err => {
            displayError();
        });
}


$('#cameraFlip').click(function () {
    webcam.flip();
    webcam.start();
});


function displayError(err = '') {
    if (err != '') {
        $("#errorMsg").html(err);
    }
    $("#errorMsg").removeClass("d-none");
}

function cameraStarted() {
    $("#errorMsg").addClass("d-none");
    $('.flash').hide();
    $("#webcam-caption").html("on");
    $("#webcam-control").removeClass("webcam-off");
    $("#webcam-control").addClass("webcam-on");
    $(".webcam-container").removeClass("d-none");
    if (webcam.webcamList.length > 1) {
        $("#cameraFlip").removeClass('d-none');
    }
    $("#wpfront-scroll-top-container").addClass("d-none");
    window.scrollTo(0, 0);
    $('body').css('overflow-y', 'hidden');
}

function cameraStopped() {
    $("#errorMsg").addClass("d-none");
    $("#wpfront-scroll-top-container").removeClass("d-none");
    $("#webcam-control").removeClass("webcam-on");
    $("#webcam-control").addClass("webcam-off");
    $("#cameraFlip").addClass('d-none');
    $(".webcam-container").addClass("d-none");
    $("#webcam-caption").html("Click to Start Camera");
    $('.md-modal').removeClass('md-show');
}


$("#take-photo").click(function () {
    beforeTakePhoto();
    let picture = webcam.snap();
    document.querySelector('#download-photo').href = picture;
    afterTakePhoto();
});

function beforeTakePhoto() {
    $('.flash')
        .show()
        .animate({ opacity: 0.3 }, 500)
        .fadeOut(500)
        .css({ 'opacity': 0.7 });
    window.scrollTo(0, 0);
    $('#webcam-control').addClass('d-none');
    $('#cameraControls').addClass('d-none');
}

function afterTakePhoto() {
    webcam.stop();
    $('#canvas').removeClass('d-none');
    $('#take-photo').addClass('d-none');
    $('#exit-app').removeClass('d-none');
    $('#download-photo').removeClass('d-none');
    $('#resume-camera').removeClass('d-none');
    $('#cameraControls').removeClass('d-none');
}

function removeCapture() {
    $('#canvas').addClass('d-none');
    $('#webcam-control').removeClass('d-none');
    $('#cameraControls').removeClass('d-none');
    $('#take-photo').removeClass('d-none');
    $('#exit-app').addClass('d-none');
    $('#download-photo').addClass('d-none');
    $('#resume-camera').addClass('d-none');
}

$("#exit-app").click(function () {
    removeCapture();
    cameraStopped();
    webcam.stop();
    console.log("webcam stopped");
});