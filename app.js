'use strict';

const co = require('co');
const request = require('co-request');
const cheerio = require('cheerio');
const _ = require('lodash');
const notifier = require('node-notifier');
const exec = require('child_process').exec;

const HOST = 'https://www.ticketswap.nl';
const EVENT_URL = '/event/wardruna-in-de-grote-zaal-tivolivredenburg/6f8d589a-b35e-4435-bb17-13b27f70bd54';
//const EVENT_URL = '/event/soenda-indoor-2019/locker-medium/7c94e2e3-aaa6-4a36-a1b6-7a8f2eda818a/1376260';
const CHECK_INTERVAL_MS = 10000;

let cookieJar = request.jar();

let buildRequest = function (uri, method) {
  console.log(`Fetching: ${uri}`);

  return request({
    uri: uri,
    method: method,
    jar: cookieJar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
    }
  });
};

let fetchResult = function (link) {
  return co(function *() {
    let result = yield buildRequest(link, 'GET');

    return cheerio.load(result.body);
  });
};

let botAction = {
  callAvailableTicket: function() {
	  setInterval(function(){
		while(true) {
			console.log("TICKET");
		}
	  }, 3000);		
  },
  robotCheck: function (url) {
    console.log(`${url} : ---> Need to visit and check if you are block as robot`);
    return notifier.notify({
      'title': 'Need check as robot',
      'message': url,
      'open': url,
    });
  },
  availableTicket: function (url, data) {
    console.log(`${url} : ---> ${data} available`);
    exec(`open ${url}`);
    return notifier.notify({
      'title': 'New ticket!!!',
      'message': url,
      'open': url,
    });
  },
  unavailableTicket: function (url, data) {
    console.log(`${url} : ---> Not available`);
    return false;
  }
};

let app = function () {
  return co(function* () {
    let result = yield buildRequest(HOST + EVENT_URL, 'GET');

    let $ = cheerio.load(result.body);
    let hasData = false;
    let linksFn = {};
	
	var ticketsString = $('#tickets h2').text();
	var isTicket = false;

    if (ticketsString.includes('Aangeboden')) {
		console.log("YYEAEAEEEEEEEEEEEEEEEHHHHHH TICKET");
		botAction.callAvailableTicket();
        //let fetchUrl = HOST + $("#tickets [class^=css-] ul [class^=css-] a").attr("href");
		let fetchUrl = HOST + EVENT_URL;
		isTicket = true;
        linksFn[fetchUrl] = fetchResult(fetchUrl);
    } else {
		console.log("ELSE");
      linksFn[HOST + EVENT_URL] = Promise.resolve($);
    }

    let linksResults = yield linksFn;

    _.each(linksResults, function ($query, url) {
      let counterValue = $query('.counter-available .counter-value').text();

      console.log(parseInt(counterValue, 10));

      if ($query('#recaptcha').length > 0) {
        return botAction.robotCheck(url);
      }

      if (isTicket) {
        return botAction.availableTicket(url, counterValue);
      }

      return botAction.unavailableTicket(url);
    });

    return true;
  }).catch(ex => {
    console.log(ex);
  });
};

app();
setInterval(app, CHECK_INTERVAL_MS);
