
function detectWebcam(callback) {
    let md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return callback(false);
    md.enumerateDevices().then(devices => {
        callback(true);
    })
}

detectWebcam(function (hasWebcam) {
    if (!hasWebcam) {
        document.getElementById("link-cam").style.display = "none";
    }
});


var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const webcam = new Webcam(webcamElement, 'environment', canvasElement);

var zoom = 1.0;
var lastTimeStamp = new Date().getTime();

$(".zoom-option").on('click', function () {
    zoom = $(this).attr("data-zoom")*1;
    webcamElement.style['transform'] = 'scale( ' + zoom + ', ' + zoom + ')';
    $('.zoom-option .fill-base').removeClass('fill-base').addClass('fill-default');
    $('.zoom-option text').attr('fill', '#000');
    $(this).find(".fill-default").removeClass('fill-default').addClass('fill-base');
    $(this).find('text').attr('fill', '#fff');
})

function startCamera() {
    $('.md-modal').addClass('md-show');
    $("#result-panel").addClass('d-none');
    $("#app-panel").removeClass('d-none');
    webcam.start()
        .then(result => {
            cameraStarted();
            console.log("webcam started");
        })
        .catch(err => {
            console.log("webcam error");
        });
}

function endCamera() {
    $('.md-modal').removeClass('md-show');   
}


function cameraStarted() {
    $('.flash').hide();
    $(".webcam-container").removeClass("d-none");
    window.scrollTo(0, 0);
    $('body').css('overflow-y', 'hidden');
}

function cameraStopped() {
    $(".webcam-container").addClass("d-none");
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

    resetTimeStamp();
    $.post({
        url: CV_URL,
        data: JSON.stringify(request),
        contentType: 'application/json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
        logElaspedTime('Failed');
        onFailedResult();
    }).done(displayJSON);
}


function backToCamera() {
    $("#result-panel").addClass('d-none');
    $("#app-panel").removeClass('d-none');
    $("#failed").addClass('d-none');
    $("#loading").removeClass('d-none');
    startCamera();
}

function onFailedResult() {
    $("#loading").addClass('d-none');
    $("#failed").removeClass('d-none');
}


/**
 * Displays the results.
 */
function displayJSON(data) {

    logElaspedTime('Got Result');

    if (!data['responses'][0].textAnnotations) {
        onFailedResult();
        return;
    }

    var max_height = 0;
    var res = '';
    for (var i = 1; i < data["responses"][0]["textAnnotations"].length; i++) {
        var vertices = data["responses"][0]["textAnnotations"][i]['boundingPoly']['vertices'];
        var hh = (vertices[2].y + vertices[3].y - vertices[0].y - vertices[1].y) / 2;
        if (max_height < hh)
            max_height = hh;
    }
    console.log("max height:" + max_height);
    for (var i = 1; i < data["responses"][0]["textAnnotations"].length; i++) {
        var vertices = data["responses"][0]["textAnnotations"][i]['boundingPoly']['vertices'];
        var hh = (vertices[2].y + vertices[3].y - vertices[0].y - vertices[1].y) / 2;
        if (hh > max_height / 2)
            res += data["responses"][0]["textAnnotations"][i]['description'];
    }

    console.log("res:" + res);
    if (!res || !res.length) {
        onFailedResult();
        return;
    }
    $("#text-searchvehicle").val(res);
    endCamera();
}

function resetTimeStamp() {
    lastTimeStamp = new Date().getTime();
}

function logElaspedTime(tag) {
    console.log(tag, (new Date().getTime() - lastTimeStamp) / 1000);
}

$("#take-photo").click(function () {
    resetTimeStamp();
    var cropped = webcam.getPlateImage();  
    logElaspedTime('Snapped');

    sendFileToCloudVision(cropped.replace('data:image/png;base64,', ''));

    var image = webcam.snapCapture();
    $("#screenshot").attr('src', image).attr('width', getWidth()).attr('height', getHeight()).css('transform', 'scale(' + zoom + ', ' + zoom + ')');
    $("#app-panel").addClass('d-none');
    $("#result-panel").removeClass('d-none');
    afterTakePhoto();
});

function afterTakePhoto() {
    webcam.stop();
    console.log("webcam stopped");
}

function removeCapture() {
    $('#canvas').addClass('d-none');
    $('#webcam-control').removeClass('d-none');
    $('#cameraControls').removeClass('d-none');
    $('#take-photo').removeClass('d-none');
}

$("#exit-app").click(function () {
    removeCapture();
    cameraStopped();
    webcam.stop();
    console.log("webcam stopped");
});

