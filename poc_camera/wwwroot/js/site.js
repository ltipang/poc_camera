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

var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

const webcamElement = document.getElementById('webcam');

const canvasElement = document.getElementById('canvas');

const snapSoundElement = document.getElementById('snapSound');

//const webcam = new Webcam(webcamElement, 'enviroment', canvasElement, snapSoundElement);
const webcam = new Webcam(webcamElement, 'enviroment', canvasElement, snapSoundElement);

var slider = document.getElementById("myRange");
var zoom = 1.0;

slider.oninput = function () {
    zoom = 1.0 + (this.value ) / 50.0;

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

function endCamera() {
    $('.md-modal').removeClass('md-show');
    
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


/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision(content) {
    var type = "TEXT_DETECTION";

    // Strip out the file prefix when you convert to json.
    var request = {
        requests: [{
            image: {
                content: content
            },
            features: [{
                type: type,
                maxResults: 200
            }]
        }]
    };

    $('#results').text('processing...');
    $.post({
        url: CV_URL,
        data: JSON.stringify(request),
        contentType: 'application/json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
        $('#results').text('ERRORS: ' + textStatus + ' ' + errorThrown);
    }).done(displayJSON);
}

/**
 * Displays the results.
 */
function displayJSON(data) {
    var contents = data['responses'][0]["fullTextAnnotation"]["text"];
    // split with new line and get one
    contents = contents.split("\n")[0];
    // remove spaces
    contents = contents.replace(/\s+/g, '');

    $('#results').text(contents);
    $("#text-searchvehicle").val(contents);

    endCamera();
}

$("#take-photo").click(function () {
    let picture = webcam.snap();
    sendFileToCloudVision(picture.replace('data:image/png;base64,', ''));
    //document.querySelector('#download-photo').href = picture;
    afterTakePhoto();
});


function afterTakePhoto() {
    webcam.stop();

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

