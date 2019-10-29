/* jslint white:true, browser:true, devel:true */


"use strict";

$(function() {

    $.fn.getPath = function() {
        var _this = this;
        if (_this.length != 1) {
            throw 'Requires one element.';
        }
        var path, node = _this;

        if (!_this[0].id) {
            return "#" + _this[0].id;
        }
        if (!_this[0].className) {
            var classItems = String(_this[0].className.repeat(1));
            var arrayItems = classItems.split(" ");
            var classesToIgnore = ["ng-dirty", "ng-touched", "ng-touched", "ng-untouched", "ng-valid", "ng-invalid",
                "ng-pristine", "circle-ng", "blink-ng", "letter-ng", "ignore-ng"
            ];


            for (var q = 0; q <= classesToIgnore.length - 1; q++) {
                for (var qi = arrayItems.length; qi > -1; qi--) {
                    if (arrayItems[qi] === classesToIgnore[q]) {
                        arrayItems.splice(qi, 1);
                    }
                }
            }
            if (document.getElementsByClassName(arrayItems.join(" ")).length == 1) {
                return "." + arrayItems.join(".");
            }
        }
        while (node.length) {
            var realNode = node[0],
                name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var siblings = parent.children(name);
            if (siblings.length > 1) {
                // cypress nthChild
                name += window.getNthChild(realNode);
            }

            path = name + (path ? ' > ' + path : ' ');
            node = parent;
        }

        return path.split('html > ')[1];
    };



});

function getNthChild(element) {
    var counter = 0;
    var k = void 0;
    var sibling = void 0;
    var parentNode = element.parentNode;


    if (Boolean(parentNode)) {
        var childNodes = parentNode.childNodes;

        var len = childNodes.length;
        for (k = 0; k < len; k++) {
            sibling = childNodes[k];
            if (sibling.nodeType == 1) {
                counter++;
                if (sibling === element) {
                    return ':nth-child(' + (counter) + ')';
                }
            }
        }
    }
    return null;
}
// Data type for storing a recording
var recording = {
    events: [],
    startTime: -1,
    htmlCopy: ''
};
var plainRecording = "";
var stepCounter = 0;
// Record each type of event
var handlers = [{
    eventName: 'click',
    handler: function handleClick(e) {
        recording.events.push({
            type: 'click',
            target: e.target,
            elementType: $(e.target).get(0).tagName.toLowerCase(),
            xpath: $(e.target).getPath(),
            x: e.pageX,
            y: e.pageY,
            time: Date.now(),
            value: e.target.value,
        });
        if (recording.events[recording.events.length - 1].elementType !== "select") {
            plainRecording += "\nit('Interaction step " + stepCounter + "', function(){";
            if (recording.events[recording.events.length - 1].elementType == "input" &&
                recording.events[recording.events.length - 1].target.type != "checkbox") {
                plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
                    "').click({force:true});";
            }

            //verify if it is a container
            if (recording.events[recording.events.length - 1].target.children.length == 0) {
                // is just an empty element, let's extract the text and use it as a test
                if (recording.events[recording.events.length - 1].target.textContent.trim() != "" &&
                    recording.events[recording.events.length - 1].target.textContent.trim() != undefined &&
                    recording.events[recording.events.length - 1].target.textContent.trim() != null &&
                    recording.events[recording.events.length - 1].target.textContent.trim() != " ") {
                    plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
                        "').contains('" + recording.events[recording.events.length - 1].target.textContent.trim() + "');";
                }
            } else {
                plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
                    "').children().should('have.length', " + recording.events[recording.events.length - 1].target.children
                    .length + ")";
            }
            // also extract the classes to make sure we detect disables and enables
            if (recording.events[recording.events.length - 1].target.className != "" &&
                recording.events[recording.events.length - 1].target.className != " " &&
                recording.events[recording.events.length - 1].target.className != null &&
                recording.events[recording.events.length - 1].target.className != undefined
                /*recording.events[recording.events.length-1].target.className.hasOwnProperty("split")*/
            ) {
                var classList = recording.events[recording.events.length - 1].target.className.split(" ");

                for (var k = 0; k <= classList.length - 1; k++) {
                    if (classList[k] != "ng-dirty" &&
                        classList[k] != "ng-touched" &&
                        classList[k] != "ng-untouched" &&
                        classList[k] != "circle-ng" &&
                        classList[k] != "blink-ng" &&
                        classList[k] != "" &&
                        classList[k] != " ") {
                        plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
                            "').should('have.class', '" + classList[k] + "');";
                    }

                }
            }
            if (recording.events[recording.events.length - 1].elementType != "input" &&
                recording.events[recording.events.length - 1].target.type != "checkbox") {
                plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
                    "').click({force:true});";
            }

            plainRecording += "\n});";
            plainRecording += minputTypes(recording.events[recording.events.length - 1], stepCounter);
            stepCounter = stepCounter + 1;
            saveToLocalStorage(plainRecording)
        }
    }
}, {
    eventName: 'keypress',
    handler: function handleKeyPress(e) {
        recording.events.push({
            type: 'keypress',
            target: e.target,
            elementType: $(e.target).get(0).tagName.toLowerCase(),
            xpath: $(e.target).getPath(),
            value: e.target.value,
            keyCode: e.keyCode,
            time: Date.now()
        });
    }
}, {
    eventName: 'change',
    handler: function handleChange(e) {
        //console.log($(e.target).getPath());
        recording.events.push({
            type: 'change',
            target: e.target,
            elementType: $(e.target).get(0).tagName.toLowerCase(),
            xpath: $(e.target).getPath(),
            value: e.target.value,
            time: Date.now()
        });
        plainRecording += minputTypes(recording.events[recording.events.length - 1], stepCounter);
        stepCounter = stepCounter + 1;
        saveToLocalStorage(plainRecording)
    }
}, {
    eventName: 'scroll',
    handler: function handleChange(e) {
        //console.log($(e.target).getPath());
        recording.events.push({
            type: 'scroll',
            target: e.target,
            elementType: $(e.target).get(0).tagName.toLowerCase(),
            xpath: $(e.target).getPath(),
            value: e.target.scrollTop,
            time: Date.now()
        });
        plainRecording += "\nit('Interaction step " + stepCounter + "', function(){";
        plainRecording += "\ncy.get('" + selectSelector(recording.events[recording.events.length - 1]) +
            "').scrollTo(0," + recording.events[recording.events.length - 1].value + ");";
        plainRecording += "\n});";
        stepCounter = stepCounter + 1;
        saveToLocalStorage(plainRecording)
    }
}];

function saveToLocalStorage(plainRecording) {
    localStorage.setItem("recording", plainRecording);
}


var recordingBt = '<div id="recording" > Test ready  </div>';

// Attach recording button
function setRecording() {

    var $body = $('body');
    $body.prepend('<div id="ignore-ng" class="ng-touched circle-ng blink-ng"></div>');
    // start recording
    if (localStorage.getItem("recording") !== null) {
        console.log(
            "Cypress recorder has a previous recording, it will continue to use that recording unless you clean it"
        );
    }
    plainRecording = localStorage.getItem("recording");
    recording.startTime = Date.now();
    recording.events = [];
    recording.htmlCopy = $(document.documentElement).html();
    recording.height = $(window).height();
    recording.width = $(window).width();
    handlers.map(function(x) {
        return listen(x.eventName, x.handler);
    });
};

$("#setRecording").click(function() {
    setRecording();
    console.log(0);

    $('.circle-ng').fadeIn();
    $('#floating-button').hide();
});

$("#getRecording").click(function() {
    getRecording();
});

$(".circle-ng").click(function() {
    $('#floating-button').fadeIn();
    $('.circle-ng').hide();
});

$("#cleanRecording").click(function() {
    cleanRecording();
});

function payload() {
    $.get("index.html", function(data) {
        $('body').html(data);
    });
}

//decide wheater to use xpath, id, data-tid or classes
function selectSelector(target) {
    //first find it using the data-tid
    if (target.target.getAttribute("data-tid") !== null) {
        //verify if the attribute identifies one element only
        if ($("[data-tid='" + target.target.getAttribute("data-tid") + "']").length === 1) {
            return '[data-tid="' + target.target.getAttribute("data-tid") + '"]';
        }
    } else if (target.target.getAttribute("data-id") !== null) {
        //verify if the attribute identifies one element only
        if ($("[data-tid='" + target.target.getAttribute("data-id") + "']").length === 1) {
            return '[data-id="' + target.target.getAttribute("data-id") + '"]';
        }
    } else if (target.target.className !== "" && target.target.className !== " " &&
        target.target.className !== null && target.target.className !== undefined) {
        //verify if the attribute identifies one element only
        var classList = target.target.className.split(" ");
        for (var k = classList.length; k > -1; k--) {
            if (classList[k] == "ng-dirty" &&
                classList[k] == "ng-touched" &&
                classList[k] == "ng-untouched" &&
                classList[k] == "" &&
                classList[k] == " ") {
                classList.splice(k, 1);
            }
        }
        if (classList.length > 0 &&
            $(classList.join(".")).length === 1) {
            var avoidDoublePeriod = classList.join(".").replace(/../g, ".");
            return "." + avoidDoublePeriod;
        }
    } else if (target.target.id !== null && target.target.id !== undefined &&
        target.target.id !== "" && target.target.id !== " ") {
        return "#" + target.target.id;
    } else {
        target.xpath;
    }
    return target.xpath;
}


var recordingLbl = '<div id="recording" > Test ready  </div>';

function CreateFile(blob) {

    var $body = $('body');
    $body.prepend(recordingLbl);
    $('#recording').append('<a download="info.txt" id="downloadlink" >Download</a>');

    var textFile = null,
        makeTextFile = function(text) {
            var data = new Blob([text], {
                type: 'application/javascript'
            });

            // If we are replacing a previously generated file we need to
            // manually revoke the object URL to avoid memory leaks.
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);
            return textFile;
        };

    var link = document.getElementById('downloadlink');
    link.href = makeTextFile(blob);
    link.download = window.location.pathname + '.spec.js';
    link.style.display = 'block';
    $('#recording').fadeIn();
    setTimeout(function() {
        $('#recording').fadeOut("slow");
        setTimeout(function() {
            $('#recording').remove();
        }, 3000);
    }, 10000);


}

document.addEventListener('setRecording', function() {
    console.log('insider....setRecording');
    setRecording();
});

document.addEventListener('getRecording', function() {
    console.log('insider....getRecording');
    getRecording();
});

document.addEventListener('cleanRecording', function() {
    console.log('insider....cleanRecording');
    cleanRecording();
});


// Replay
function getRecording() {
    $('.circle-ng').hide();
    // generate cypress xpath
    // console.log(recording);
    var cypressCommands = "describe('" + document.title + " APP',function(){";
    cypressCommands += "\nit('starts the application', function(){";
    cypressCommands += "\ncy.clearCookies();";
    cypressCommands += "\ncy.clearLocalStorage();";
    cypressCommands += "\ncy.window().then((win) => {";
    cypressCommands += "\nwin.sessionStorage.clear();"
    cypressCommands += "\n});"
    cypressCommands += "\ncy.visit('" + window.location.href + "/');";
    cypressCommands += "\n});";
    cypressCommands += localStorage.getItem("recording");
    cypressCommands += "\n});";
    // console.log(cypressCommands.replace(/null/g, ""));
    let blob = cypressCommands.replace(/null/g, "");
    CreateFile(blob);
};



function cleanRecording() {
    console.log('..ready for next..');

    localStorage.removeItem("recording");
    plainRecording = '';
}

function minputTypes(recorderEvent, step) {
    var cypressCommand = "";
    if (recorderEvent.value == null || recorderEvent.value == undefined || recorderEvent.value == "") {
        return "";
    }
    if (recorderEvent.elementType === "select") {
        cypressCommand += "\nit('Interaction step " + step + "', function(){";
        cypressCommand += "\ncy.get('" + recorderEvent.xpath + "').select('" + recorderEvent.value + "');";
        cypressCommand += "\n});";
    } else if (recorderEvent.elementType === "input" &&
        recorderEvent.target.type != "checkbox" &&
        recorderEvent.target.type != "radio") {
        cypressCommand += "\nit('Interaction step " + step + "', function(){";
        cypressCommand += "\ncy.get('" + recorderEvent.xpath + "').clear();";
        cypressCommand += "\ncy.get('" + recorderEvent.xpath + "').type('" + recorderEvent.value + "');";
        cypressCommand += "\n});";
    } else if (recorderEvent.elementType === "input" &&
        (recorderEvent.target.type == "checkbox" ||
            recorderEvent.target.type == "radio")) {

        cypressCommand += "\nit('Interaction step " + step + "', function(){";
        if (recorderEvent.target.checked) {
            cypressCommand += "\ncy.get('" + recorderEvent.xpath + "').check();";
        } else {
            cypressCommand += "\ncy.get('" + recorderEvent.xpath + "').uncheck();";

        }
        cypressCommand += "\n});";
    }
    return cypressCommand;
}




// Helpers

function listen(eventName, handler) {
    // listens even if stopPropagation
    return document.documentElement.addEventListener(eventName, handler, true);
}

function removeListener(eventName, handler) {
    // removes listen even if stopPropagation
    return document.documentElement.removeEventListener(eventName, handler, true);
}

function flashClass($el, className) {
    $el.addClass(className).delay(200).queue(function() {
        return $el.removeClass(className).dequeue();
    });
}
console.log("script is loaded ")