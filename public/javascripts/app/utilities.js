/* jshint unused: false */

function getValue(selector, fn){
  var value = $(selector).val();
  value = value.trim();
  $(selector).val('').css('background-color', '#ffffff');

  if(fn){
    value = fn(value);
  }

  return value;
}

function parseUpperCase(string){
  return string.toUpperCase();
}

function parseLowerCase(string){
  return string.toLowerCase();
}

function formatCurrency(number){
  return '$' + number.toFixed(2);
}

function submitAjaxForm(event, form, fn) {
  var url = $(form).attr('action');
  var data = $(form).serialize();

  var options = {};
  options.url = url;
  options.type = 'POST';
  options.data = data;
  options.success = function(data, status, jqXHR){
    fn(data, form);
  };
  options.error = function(jqXHR, status, error){
    console.log(error);
  };


  $.ajax(options);

  event.preventDefault();
}


function sendAjaxRequest(url, data, verb, altVerb, event, fn, form){
  var options = {};
  options.url = url;
  options.type = verb;
  options.data = data;
  options.success = function(data, status, jqXHR){
    fn(data, form);
  };
  options.error = function(jqXHR, status, error){console.log(error);};

  if(altVerb) {
    if(typeof data === 'string') {
      options.data += '&_method=' + altVerb;
    }
    else {
      options.data._method = altVerb;
    }
  }
  $.ajax(options);
  if(event) {event.preventDefault();}
}
