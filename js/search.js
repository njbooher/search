var documentsTabShown = 0;
var imagesTabShown = 0;
var publicationsTabShown = 0;

/* http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/ */
(function($,sr){
  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
    var timeout;
  
    return function debounced () {
      var obj = this, args = arguments;
      function delayed () {
        if (!execAsap) {
          func.apply(obj, args);
        }
        timeout = null;
      }
  
      if (timeout) {
        clearTimeout(timeout);
      }
      else if (execAsap) {
        func.apply(obj, args);
      }
  
      timeout = setTimeout(delayed, threshold || 200);
    };
  };

  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize.sr', debounce(fn)) : this.trigger(sr); };
})(jQuery,'smartresize');

(function($,ss){
  var debounce = function (func, threshold, execAsap) {
    var timeout;
  
    return function debounced () {
      var obj = this, args = arguments;
      function delayed () {
        if (!execAsap) {
          func.apply(obj, args);
        }
        timeout = null;
      }
  
      if (timeout) {
        clearTimeout(timeout);
      }
      else if (execAsap) {
        func.apply(obj, args);
      }
  
      timeout = setTimeout(delayed, threshold || 10);
    };
  };

  jQuery.fn[ss] = function(fn){  return fn ? this.bind('scroll.ss', debounce(fn)) : this.trigger(ss); };
})(jQuery,'smartscroll');

function parseDate(input) {
  var parts = input.split('/');
  return new Date(parts[2], parts[0]-1, parts[1]); 
}



var search = angular.module("search", ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngAria', 'angularMoment', 'pickadate', 'breakpointApp', 'ui.bootstrap', 'vcRecaptcha', 'gsaControllers']);

var cacheVariable = "?v=" + Date.now();
search.constant("cacheVariable", cacheVariable);

angular.module('exceptionOverride', []).factory('$exceptionHandler', function() {
  return function(exception, cause) {
    exception.message += ' (caused by "' + cause + '")';

    throw exception;
  };
});

search.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $routeProvider.
      when('/', {
        templateUrl: '/partials/landing.html' + cacheVariable,
        controller: 'landing'
      }).
      when('/pages/:term/:page?', {
        templateUrl: '/partials/pages.html' + cacheVariable,
        controller: 'gsaPages'
      }).
      when('/documents/:term/:page?', {
        templateUrl: '/partials/documents.html' + cacheVariable,
        controller: 'gsaDocuments'
      }).
      when('/media/:term?', {
        templateUrl: '/partials/media.html' + cacheVariable,
        controller: 'gsaMedia'
      }).
      when('/people/:term', {
        templateUrl: '/partials/people.html' + cacheVariable,
        controller: 'people'
      }).
      when('/publications/:type?/:term?', {
        templateUrl: '/partials/publications.html' + cacheVariable,
        controller: 'publications'
      }).
      when('/events/:term?', {
        templateUrl: '/partials/events.html' + cacheVariable,
        controller: 'events'
      }).
      otherwise({
        redirectTo: '/'
      });
  }
]);

search.run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
  var original = $location.path;
  $location.path = function (path, reload) {
    if (reload === false) {
      var lastRoute = $route.current;
      var un = $rootScope.$on('$locationChangeSuccess', function () {
        $route.current = lastRoute;
        un();
      });
    }

    return original.apply($location, [path]);
  };
}]);

/* http://stackoverflow.com/questions/17289448/angularjs-to-output-plain-text-instead-of-html */
search.filter('htmlToPlaintext', function() {
  return function(text) {
    return text ? String(text).replace(/<[^>]+>/gm, '') : '';
  };
});

search.filter('trustAsResourceUrl', ['$sce', function($sce) {
  return function(val) {
    return $sce.trustAsResourceUrl(val);
  };
}]);

search.filter('eventsTag', function(){
  return function(text) {
    return text ? text.replace('org/', '') : '';
  };
});

/* based on http://stackoverflow.com/questions/15454900/is-it-possible-to-filter-angular-js-by-containment-in-another-array */
search.filter('inArray', function($filter){
  return function(list, arrayFilter, element, active){
    if(active){
      if (arrayFilter.length) {
        return $filter("filter")(list, function(listItem){
          return arrayFilter.indexOf(listItem[element]) != -1;
        });
      }
      return list;
    }
    else {
      return list;
    }
  };
});

/* based on http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string */
search.filter('website', function() {
  return function(url) {
    var matches = url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
    return matches && matches[1];
  };
});

search.filter('filename', function() {
  return function(input) {
    return /[^/]*$/.exec(input)[0];
  };
});

search.filter("dateFilter", function() {
  return function(items, date) {
    if (typeof date === 'string') {
      var df = parseDate(date);

      var result = [];
      for (var i = 0; i < items.length; i++) {
        var tf = new Date(items[i].start.longdate);
        var tt = new Date(items[i].end.longdate);
  
        if (tf <= df && tt >= df) {
          result.push(items[i]);
        }
      }            
      return result;
    }
    else {
      return items;
    }
  };
});

search.directive('popoverImage', function () {
  return {
    restrict: 'A',
    template: '<div ng-transclude></div>',
    transclude: true,
    link: function (scope, element, attrs) {
      scope.image = attrs.popoverImage;

      jQuery(element).popover({
        delay: { "show": 50, "hide": 200 },
        trigger: 'hover',
        html: true,
        content: '<img class="img-rounded" width="276" height="276" alt="" src="' + scope.image + '">',
        placement: 'auto right'
      });
    }
  };
});

search.directive('cantFind', ['$timeout', '$http', '$location', function ($timeout, $http, $location) {
  return {
    restrict: 'E',
    transclude: true,
    templateUrl: '/partials/cant-find.html' + cacheVariable,
    link: function ($scope, $element, $attrs) {
      $scope.showForm = false;
      $scope.global.formFinished = false;
      $scope.formData = {
        looking: "",
        link: "",
        comments: "",
        name: "",
        email: ""
      };

      $scope.toggleForm = function() {
        $scope.showForm = !$scope.showForm;
        if ($scope.showForm) {
          $scope.global.cancelFixedFooter = 1;
        }
        else {
          $scope.global.cancelFixedFooter = 0;
        }
      };

      $scope.submit = function($event) {
        $timeout(function() {
          $("#form-submit").button('loading');
        }, 0);

        var recaptchaVal = jQuery($event.currentTarget).find(".g-recaptcha-response").val();

        if (recaptchaVal && $scope.formData.looking) {
          var params = {
            "g-recaptcha-response": recaptchaVal
          };

          $http({
            method: 'POST',
            url: '/cant-find-submission.php',
            params: {
              looking: $scope.formData.looking,
              link: $scope.formData.link,
              comments: $scope.formData.comments,
              name: $scope.formData.name,
              email: $scope.formData.email,
              path: encodeURI($location.path()),
              "g-recaptcha-response": recaptchaVal
            }
          }).success(function(data) {
            $scope.feedback = data;
            if (data == 'success') {
              $timeout(function() {
                $("#form-submit").button('success').removeClass('btn-danger btn-primary').addClass('btn-success');
              }, 0);

              $scope.toggleForm();
              $scope.global.formFinished = 'cantfind';
            }
            else {
              $timeout(function() {
                $("#form-submit").button('error').removeClass('btn-primary btn-success').addClass('btn-danger');
              }, 0);
              $timeout(function() {
                $("#form-submit").button('reset').removeClass('btn-danger btn-success').addClass('btn-primary');
              }, 5000);
            }
          });
        }
        else {
          $timeout(function() {
            $("#form-submit").button('error').removeClass('btn-primary btn-success').addClass('btn-danger');
          }, 0);
          $timeout(function() {
            $("#form-submit").button('reset').removeClass('btn-danger btn-success').addClass('btn-primary');
          }, 5000);
        }
      };


    }
  };
}]);


search.directive('feedbackForm', ['$timeout', '$http', '$location', function ($timeout, $http, $location) {
  return {
    restrict: 'E',
    transclude: true,
    templateUrl: '/partials/feedback-form.html' + cacheVariable,
    link: function ($scope, $element, $attrs) {
      $scope.showForm = false;
      $scope.global.formFinished = false;
      $scope.formData = {
        comments: "",
        name: "",
        email: ""
      };

      $scope.toggleForm = function() {
        $scope.showForm = !$scope.showForm;
        if ($scope.showForm) {
          $scope.global.cancelFixedFooter = 1;

        }
        else {
          $scope.global.cancelFixedFooter = 0;
        }
      };

      $scope.submit = function($event) {
        $timeout(function() {
          $("#form-submit").button('loading');
        }, 0);

        var recaptchaVal = jQuery($event.currentTarget).find(".g-recaptcha-response").val();

        if (recaptchaVal && $scope.formData.comments) {
          var params = {
            "g-recaptcha-response": recaptchaVal
          };

          $http({
            method: 'POST',
            url: '/feedback-submission.php',
            params: {
              comments: $scope.formData.comments,
              name: $scope.formData.name,
              email: $scope.formData.email,
              path: encodeURI($location.path()),
              "g-recaptcha-response": recaptchaVal
            }
          }).success(function(data) {
            $scope.feedback = data;
            if (data == 'success') {
              $timeout(function() {
                $("#form-submit").button('success').removeClass('btn-danger btn-primary').addClass('btn-success');
              }, 0);

              $scope.toggleForm();
              $scope.global.formFinished = 'feedback';
            }
            else {
              $timeout(function() {
                $("#form-submit").button('error').removeClass('btn-primary btn-success').addClass('btn-danger');
              }, 0);
              $timeout(function() {
                $("#form-submit").button('reset').removeClass('btn-danger btn-success').addClass('btn-primary');
              }, 5000);
            }
          });
        }
        else {
          $timeout(function() {
            $("#form-submit").button('error').removeClass('btn-primary btn-success').addClass('btn-danger');
          }, 0);
          $timeout(function() {
            $("#form-submit").button('reset').removeClass('btn-danger btn-success').addClass('btn-primary');
          }, 5000);
        }
      };


    }
  };
}]);

search.factory('GSA', function($http) {
  var cachedSearch = {};
  var cachedClusterQuery = {};

  return {
    search: function(params) {
      args = JSON.stringify(params);
      
      var request;
      if (cachedSearch[args]) {
        request = cachedSearch[args];
      }
      else {
        request = $http({
          "method": "GET",
          "url": "/gsa-search-query.php",
          "params": params
        });
        cachedSearch[args] = request;
      }

      return request.then(function(result) {
        return result.data;
      });      
    },
    clusterQuery: function(keywords) {
      var request;
      if (cachedClusterQuery[keywords]) {
        request = cachedClusterQuery[keywords];
      }
      else {
        request = $http({
          "method": "GET",
          "url": "/gsa-search-cluster.php",
          "params": {
            q: keywords
          }
        });
        cachedClusterQuery[keywords] = request;
      }
      
      return request.then(function(result) {
        return result.data;
      });
    }
  };

});

search.factory('People', function($http) {
  var cachedQuery = {},
  cachedQueryUni = {};

  return {
    query: function(params) {
      var request;
      if (cachedQuery[params.term]) {
        request = cachedQuery[params.term];
      }
      else {
        request = $http({
          "method": "GET",
          "url": "/directory-query.php",
          "params": params,
          "timeout": 10000
        });
        cachedQuery[params.term] = request;
      }
      
      return request.then(function(result) {
        return result.data;
      });
    },
    queryUni: function(params) {
      var request;
      if (cachedQueryUni[params.term]) {
        request = cachedQueryUni[params.term];
      }
      else {
        request = $http({
          "method": "GET",
          "url": "/directory-query-uni.php",
          "params": params,
          "timeout": 10000
        });
        cachedQueryUni[params.term] = request;
      }
      
      return request.then(function(result) {
        return result.data;
      });
    }
  };

});

search.factory('Events', function($http) {
  Events = $http.get('/fetch-events.php');

  return {
    retrieve: function() {
      return Events.then(function(result) {
        return result.data.bwEventList;
      });
    }
  };
});

search.factory('Publications', function($http) {
  return {
    fetch: function(q, rows) {
      params = {
        q: q,
        rows: (rows) ? rows : 5
      };

      request = function() {
        return $http({
          "method": "GET",
          "url": "/ac-query.php",
          "params": params,
          "responseType": 'json'
        });
      };

      return request().then(function(result) {
        if (result) {
          if (result.data) {
            if (result.data.channel) {
              return result.data.channel.item;
            }
          }
        }
      });
    },
    fetchUni: function(q, rows) {
      params = {
        fq: 'author_uni:' + q,
        rows: (rows) ? rows : 5
      };

      request = function() {
        return $http({
          "method": "GET",
          "url": "/ac-query.php",
          "params": params,
          "responseType": 'json'
        });
      };

      return request().then(function(result) {
        if (result.data) {
          return result.data.channel.item;
        }
      });
    }
  };
});

var gsaControllers = angular.module('gsaControllers', []);

gsaControllers.controller('global', ['$scope', '$http', '$timeout', '$location', '$route', '$filter', '$anchorScroll', 'GSA', 'People', 'Events', function($scope, $http, $timeout, $location, $route, $filter, $anchorScroll, GSA, People, Events) {
/*
  gsaDefaultClient = 'DoC',
  gsaDefaultSite = 'Directory_of_Classes',
*/
  var gsaDefaultClient = 'default_frontend';
  var gsaDefaultSite = 'default_collection';
  var gsaLimit = 10;
  var gmap = {};
  var gmapLookupCache = {};
  var gmapExpandCache = {};
  var gmapMarkersAlpha = {};
  var gmapMarkersText = {};
  var gmapBounds = [];
  var gmapInfoWindow = [];

  $scope.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  $scope.global = {
    path: $location.path(),
    pageTitle: "Columbia University Search",
    pageTitleDefault: "Columbia University Search",
    loaded: 0,
    loadedNotEmpty: 0,
    controller: '',
    overlayShown: 0,
    cancelFixedFooter: 0,
    formFinished: false,
    recaptchaKey: '6Lc2kRMUAAAAANgXXzAT488u3tk2QYdOEGiCNz06'
  };

  $scope.global.tabs = [{
    label: "Columbia.edu",
    path: "pages",
    controller: "gsaPages"
  }, {
    label: "People",
    path: "people",
    controller: "people"
  }, {
    label: "Events",
    path: "events",
    controller: "events",
    permanent: true
  }];

  if (imagesTabShown) {
    $scope.global.tabs.push({
      label: "Images",
      path: "media",
      controller: "gsaMedia"
    });
  }

  if (documentsTabShown) {
    $scope.global.tabs.push({
      label: "Documents",
      path: "documents",
      controller: "gsaDocuments"
    });
  }

  if (publicationsTabShown) {
    $scope.global.tabs.push({
      label: "Publications",
      path: "publications/q",
      controller: "publications",
      permanent: true
    });
  }

/*
  $scope.global.tabs.push({
    label: "Courses",
    path: "https://vergil.registrar.columbia.edu/#/courses",
    external: true
  });
*/

  $scope.nav = {
    classes: '',
    focusedTree: -1,
    mobileOpen: false
  };

  $scope.gsa = {
    data: {},
    lastParams: {},
    currentPage: 1,
    client: gsaDefaultClient,
    site: gsaDefaultSite,
    filter: 1,
    gmapVisible: 0,
    gmapFocus: 0,
    instant: 0,
    paginationPage: 1
  };
  
  $scope.events = {
    data: {},
    filteredEvents: {},
    limit: 20
  };
  
  $scope.map = {
    gmapMarkers: {}
  };

  $scope.$on('$routeChangeSuccess', function(e, current) { 
    if ($location.hash()) {
      $anchorScroll();
    }

    $scope.global.controller = current.controller;

    filtered = $filter('filter')($scope.global.tabs, {controller: $scope.global.controller}, true);
    if (filtered[0]) {
      $scope.global.page = filtered[0].label;
    }
  });

  $scope.nav.toggleFocusedTree = function(i) {    
    if ($scope.nav.focusedTree == i) {
      $scope.nav.focusedTree = -1;
    }
    else {
      $scope.nav.focusedTree = i;
    }
  };

  $scope.nav.focus = function(i) {
    $scope.nav.focusedTree = i;

    if (i == -1) {
      $scope.nav.classes = '';
    }
    else {
      $scope.nav.classes = 'nav-focused';
    }
  };
  
  $scope.nav.mobileToggle = function() {
    $scope.nav.mobileOpen = !$scope.nav.mobileOpen;
  };
  
  $scope.nav.searchToggle = function() {
    $scope.nav.mobileOpen = false;
    $scope.global.keywords = "";
    $('#gsa-keywords').typeahead('val', '');

    $timeout(function() {
      $("#gsa-keywords").focus();
    }, 1);
  };

  $scope.global.initSearch = function() {
    $scope.global.loaded = 0;
    $scope.global.loadedNotEmpty = 0;

    $scope.global.tabs[1].empty = false;

    $scope.global.searchType = "";
    if ($scope.global.keywords) {
      if ($scope.global.keywords.match(/^[a-z]+[0-9]+$/)) {
        $scope.global.searchType = "UNI";
      }
    }
  };

/*
  $scope.$on('breakpointChange', function(event, breakpoint, oldClass) {
    if (breakpoint.class == "mobile") {
    }
  });
*/

  _gsaSearchQuery = function(params, instant) {
    if (!instant) {
      if (JSON.stringify(params) !== JSON.stringify($scope.gsa.lastParams)) {
        $scope.gsa.lastParams = params;

        $scope.global.loaded = 0;
        $scope.global.loadedNotEmpty = 0;
        $scope.resultsCount = 0;

        $scope.gsa.data = {};
  
//        $scope.gsa.gmapLookup();
        $scope.gsa.gmapVisible = 0;
  
        GSA.search(params).then(function(data) {        
          $scope.gsa.data = data;
          $scope.global.loaded = 1;

          $scope.gsa.instant = 0;

          if ($scope.gsa.data.results_nav) {
            $scope.gsa.paginationPage = $scope.gsa.data.results_nav.current_view / 10 + 1;
          }

          $scope.gsa.currentPage = ($scope.gsa.data.results_nav) ? $scope.gsa.data.results_nav.results_end : 1;
          
          $scope.resultsCount = Number($scope.gsa.data.results_nav.total_results);
          
          if ($scope.resultsCount > 0) {
            $scope.global.loadedNotEmpty = 1;
            $scope.global.tabs[0].empty = false;

            if ($scope.global.controller == "gsaDocuments") {
              for (var i in $scope.gsa.data.results) {
                var item = $scope.gsa.data.results[i];

                var type = (function(mime) {
                  switch (mime) {
                    case "application/msword":
                      return { icon: "file-word-o", label: "Word" };
                    case "application/pdf":
                      return { icon: "file-pdf-o", label: "PDF" };
                    case "application/xls":
                      return { icon: "file-excel-o", label: "Excel" };
                    case "application/powerpoint":
                      return { icon: "file-powerpoint-o", label: "PPT" };
                    case "application/text":
                      return { icon: "file-text-o", label: "Text" };
                    default:
                      return { icon: "file-o", label: "" };
                  }
                })(item.mime);

                $scope.gsa.data.results[i].type = type;

              }
            }

          }
    
          GSA.clusterQuery(params.q).then(function(data) {
            $scope.gsa.cluster = data.clusters;
          });
  
        });

        if ($scope.global.controller == "gsaPages") {
          /* Parallel people search */
          var peopleQueryParams = {
            term: $scope.global.keywords
          };
    
          People.query(peopleQueryParams).then(function(data) {
            $scope.people = data;

            $scope.resultsCount += Number($scope.people.length);
  
            if ($scope.global.searchType == "UNI" && !$scope.gsa.data.results && $scope.people.length) {
/*
              $scope.$evalAsync(function() {
                $scope.global.tabs[0].empty = true;
                $location.path('/people/' + $scope.global.keywords, false);
                $scope.global.controller = 'people';                
              });
*/
            }

            if (!$scope.people.length) {
              $scope.global.tabs[1].empty = true;
            }
            else {
              $scope.global.tabs[1].empty = false;
              $scope.global.loadedNotEmpty = 1;
            }
          });
        }
  
      }
      else { /* If request is the same */
        $scope.global.loaded = 1;
        $scope.gsa.instant = 0;
        $scope.resultsCount = 0;
        
        if ($scope.gsa.data) {
          if ($scope.gsa.data.results_nav) {
            $scope.resultsCount = Number($scope.gsa.data.results_nav.total_results);
          }
        }
        if ($scope.people) {
          $scope.resultsCount += Number($scope.people.length);
        }
        if ($scope.resultsCount > 0) {
          $scope.global.loadedNotEmpty = 1;
        }
      }
    }
    else {
      $scope.global.loaded = 0;
      $scope.global.loadedNotEmpty = 0;
      $scope.resultsCount = 0;

      GSA.search(params).then(function(data) {        
        $scope.global.loaded = 1;

        $scope.gsa.data = data;
        $scope.gsa.instant = 1;

        $scope.resultsCount = Number($scope.gsa.data.results_nav.total_results);
        
        if ($scope.resultsCount > 0) {
          $scope.global.tabs[0].empty = false;
          $scope.global.loadedNotEmpty = 1;
        }
      });      
    }
  };

  _gsaSearchPeopleQuery = function(params) {
    if (JSON.stringify(params) !== JSON.stringify($scope.gsa.lastParams)) {
      $scope.gsa.lastParams = params;

      $scope.people = {};

//      $scope.gsa.gmapLookup();

      People.query(params).then(function(data) {        
        $scope.people = data;
        $scope.global.loaded = 1;

        if (!$scope.people.length) {
          $scope.global.tabs[1].empty = true;
        }
        else {
          $scope.global.tabs[1].empty = false;              
          $scope.global.loadedNotEmpty = 1;

/* potential map display for location /*
/*
          for (i in $scope.people) {
            var location = $scope.people[i].postaladdress.replace(/<br \/>/g, ', ');
          }
*/

        }
      });
    }
  };

  getBaseParams = function() {
    var filetype = "";
    gsaLimit = 10;

    var gsaSite = $scope.gsa.site;
    
    if ($scope.global.controller == "gsaDocuments") {
      filetype = " filetype:doc OR filetype:pdf OR filetype:xls OR filetype:ppt OR filetype:txt";
    }
    else if ($scope.global.controller == "gsaMedia") {
//      var filetype = " ext:jpg OR ext:jpeg OR ext:gif OR ext:png";
      gsaLimit = 12;
      gsaSite = 'Columbia2Media';
    }

    var params = {
      'client': $scope.gsa.client,
      'site': gsaSite,
      'output': 'xml',
      'getfields': '*',
      'num': gsaLimit,
      'filter': $scope.gsa.filter,
      'q': $scope.global.keywords + filetype
    };
    
    return params;
  };

  $scope.gsa.keywordsUpdate = function() {
    if (!Modernizr.touch) {
      if ($scope.global.controller == "gsaPages" || $scope.global.controller == "gsaDocuments" || $scope.global.controller == "gsaMedia") {
/*
        if ($scope.global.keywords) {
          var params = getBaseParams();
          
          _gsaSearchQuery(params, 1);
        }
*/
      }
      else if ($scope.global.controller == "events") {
        $scope.events.filterEvents();
      }
      
      if ($scope.global.keywords.match(/^[a-z]+[0-9]+$/)) {
        $scope.global.searchType = "UNI";
      }
      else {
        $scope.global.searchType = "";
      }
/*
      else {
        $scope.events.filterEvents();
        $scope.events.searchEvents();
      }
*/
    }
  };

  $scope.gsa.keyUp = function(e) {
    if (e.keyCode == 13) {
      $timeout(function() {
        $scope.global.keywords = $('#gsa-keywords').typeahead('val');
      }, 0);
    }
  };

  $scope.gsa.keywordsFocus = function() {
    $scope.global.overlayShown = 1;
  };


  $scope.gsa.keywordsBlur = function() {
    $scope.global.overlayShown = 0;

/*
    if ($scope.breakpoint.class != "mobile") {
      if ($scope.global.controller != "events" && $scope.global.controller != "publications") {

        $scope.global.keywords = $('#gsa-keywords').typeahead('val');

        if ($scope.global.keywords) {
          var params = getBaseParams();

          _gsaSearchQuery(params);
        }
      }
      else if ($scope.global.controller == "events") {
        $scope.events.filterEvents();
      }
    }
*/
  };

  $scope.gsa.searchQuery = function() {
    if ($scope.global.keywords) {
      var params = getBaseParams();
      
      $scope.global.keywordsSubmitted = $scope.global.keywords;

      _gsaSearchQuery(params);
    }
  };

  $scope.gsa.searchPeopleQuery = function() {
    if ($scope.global.keywords) {
      var params = {
        term: $scope.global.keywords
      };
           
      $scope.global.keywordsSubmitted = $scope.global.keywords;

      _gsaSearchPeopleQuery(params);
    }
  };

  $scope.events.searchEvents = function() {
    $scope.events.limit = 20;

    $scope.global.keywordsSubmitted = $scope.global.keywords;

    $scope.gsa.gmapLookupEvents();
  };

  $scope.gsa.searchSubmit = function() {
    $timeout(function() {
      $scope.global.keywords = $('#gsa-keywords').typeahead('val');
      $scope.global.keywordsSubmitted = $scope.global.keywords;
      $('#gsa-keywords').blur().typeahead('close');

      if ($scope.global.controller == "people") {
        $location.path('/people/' + $scope.global.keywords, true);
      }
      else if ($scope.global.controller == "gsaDocuments") {
        $location.path('/documents/' + $scope.global.keywords, true);
      }
      else if ($scope.global.controller == "gsaMedia") {
        $location.path('/media/' + $scope.global.keywords, true);
      }
      else if ($scope.global.controller == "events") {
        $location.path('/events/' + $scope.global.keywords, true);
      }
      else if ($scope.global.controller == "publications") {
        if ($scope.global.searchType != "UNI") {
          $location.path('/publications/keyword/' + $scope.global.keywords, true);
        }
        else {
          $location.path('/publications/person/' + $scope.global.keywords, true);
        }
      }
      else if ($scope.global.controller == "landing") {
        $location.path('/pages/' + $scope.global.keywords, true);
      }
      else {
        $location.path('/pages/' + $scope.global.keywords, true);
      }

    }, 0);
  };

  $scope.gsa.next = function() {
    if ($scope.gsa.data.results_nav.have_next) {
      var params = getBaseParams();

      params.start = $scope.gsa.currentPage;
      
      _gsaSearchQuery(params);
    }
  };

  $scope.gsa.previous = function() {
    if ($scope.gsa.data.results_nav.have_prev) {
      var params = getBaseParams();

      params.start = $scope.gsa.currentPage - gsaLimit - 10;
      
      _gsaSearchQuery(params);
    }
  };
  
  $scope.gsa.number = function(index) {
    if ($scope.gsa.currentPage > 9) {
      return parseInt($scope.gsa.currentPage) - gsaLimit + 1 + index;
    }
    else {
      return index + 1;
    }
  };
  
  $scope.gsa.clear = function() {
    $scope.gsa.data = {};
  };

  $scope.gsa.initMap = function() {
    if ($scope.breakpoint.class != "mobile") {
      gmap = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: {lat: 40.8081563, lng: -73.96184160000001}
      });
    }
    else {
      $scope.gsa.gmapVisible = 0;
      $scope.gsa.gmapFocus = 0;
      $scope.map.label = '';
    }
  };
  
  $scope.gsa.setGmapFocus = function() {
    if ($scope.gsa.gmapFocus != 1) {
      $scope.gsa.gmapFocus = 1;
      $timeout(function() {
        google.maps.event.trigger(gmap, 'resize');
  
        var test = gmapBounds.getCenter();
  
        if (test.G != 1 && test.G !== 0) {
          gmap.fitBounds(gmapBounds);
          google.maps.event.addListenerOnce(gmap, "idle", function() { 
            if (gmap.getZoom() > 17) {
              gmap.setZoom(17);
            }
          });
        }
      }, 50);
    }
  };

  $scope.gsa._gmapLookup = function(data) {
    if (data != "pending" && data != "not found") {

      var marker = new google.maps.Marker({
        position: data.geometry.location,
        label: data.address_components[0].long_name,
        animation: google.maps.Animation.DROP,
        map: gmap
      });
      $scope.map.label = data.address_components[0].long_name;
      
      $scope.map.gmapMarkers[JSON.stringify(data.geometry.location)] = marker;
      $scope.map.gmapMarkersCount = Object.keys($scope.map.gmapMarkers).length;
      
      gmapBounds.extend(marker.position);

      $timeout(function() {
//        $scope.gsa.gmapVisible = 1;
        $scope.gsa.gmapVisible = 0;

        $timeout(function() {
          google.maps.event.trigger(gmap, 'resize');
  
          var test = gmapBounds.getCenter();
    
          if (test.G != 1 && test.G !== 0) {
            gmap.fitBounds(gmapBounds);
            google.maps.event.addListenerOnce(gmap, "idle", function() { 
              if (gmap.getZoom() > 17) {
                gmap.setZoom(17);
              }
            });
          }
        }, 1);

      }, 1);
    }
  };

  $scope.gsa.gmapLookup = function() {
    if ($scope.breakpoint.class != "mobile") {
      /* Remove anything within parenthesis or brackets */
      /* Remove ampersand and anything before it */
      /* Remove numbers from addresses */
      /* Remove single characters (usually residuals from removing address numbers) */
      /* Remove names Google does not register */
      if ($scope.global.keywords && $scope.global.controller == "gsaPages") {
        var location = $scope.global.keywords;

        location = location.replace(/ *\([^)]*\) */g, "").replace(/ *\[[^\]]*\] */g, "").replace(/ *.[^&]*\& */g, "").replace(/(^| ).( |$)/, '');
        /* For non-street address, strip room numbers */
        if (!location.match(' Ave')) {
          location = location.replace(/LL[0-9]/g, '').replace(/[0-9]/g, '');
        }
        /* Some text substitutions */
        location = location.replace('Seeley W.', '').replace('International Affairs Building', '420 W 118th St').replace('Broadway Residence Hall', '2900 Broadway');
    
        location = location.trim() + ', New York, NY 10027';

        $scope.gsa.gmapVisible = 0;
        $scope.gsa.gmapFocus = 0;
        $scope.map.label = '';

        gmapBounds = new google.maps.LatLngBounds();

        for (var item in $scope.map.gmapMarkers) {
          $scope.map.gmapMarkers[item].setMap(null);
        }
        $scope.map.gmapMarkers = {};
        $scope.map.gmapMarkersCount = 0;
    
        if (!gmapLookupCache[location]) {
          gmapLookupCache[location] = "pending";
   
          $http({
            "method": "GET",
            "url": "https://maps.googleapis.com/maps/api/geocode/json",
            "params": {
              key: 'AIzaSyBTTp7xol914jf5wv2kLYc2Qpcu0073Nj0',
              address: location,
              components: 'postal_code:10027'
            }
          })
          .success(function(data) {
            gmapLookupCache[location] = (data.results[0].geometry.location_type == "ROOFTOP" || data.results[0].geometry.location_type == "RANGE_INTERPOLATED") ? data.results[0] : "not found";
    
            $scope.gsa._gmapLookup(gmapLookupCache[location]);
          });
        }
        else {
          $scope.gsa._gmapLookup(gmapLookupCache[location]);    
        }
  
      }
    }
  };

  $scope.gsa.gmapExpandUrl = function(url, item) {
    if (!gmapExpandCache[url]) {
      gmapExpandCache[url] = "pending";

      $http({
        "method": "GET",
        "url": "/google-urlshortener.php",
        "params": {
          url: url
        }
      })
      .success(function(data) {
        if (data.longUrl && $scope.events.filteredEvents[item]) {
          var longUrlArray = data.longUrl.split("/");

          gmapExpandCache[url] = longUrlArray[6].substring(1, longUrlArray[6].length - 4);
  
          $scope.events.filteredEvents[item].geocode = gmapExpandCache[url];
//          $scope.gsa._gmapLookupEvents(item);
        }
      });
    }
    else {
      if (gmapExpandCache[url] == "pending") {
        $timeout(function() {
          if (gmapExpandCache[url] != "pending" && $scope.events.filteredEvents[item]) {
            $scope.events.filteredEvents[item].geocode = gmapExpandCache[url];
//            $scope.gsa._gmapLookupEvents(item);
          }
        }, 1000);
      }
      else {
        $scope.events.filteredEvents[item].geocode = gmapExpandCache[url];
//        $scope.gsa._gmapLookupEvents(item);
      }
    }
  };

  $scope.gsa._gmapLookupEvents = function(index) {
    var element = $scope.events.filteredEvents[index];

    var gmapMarkersTextTemplate = '<div class="event-label"><strong>' + element.start.shortdate + '</strong> <a href="/events/' + element.summary +'">' + element.summary + '</a></div>';

    var latlngArray = element.geocode.split(",");
    var gmapLatLng = {lat: parseFloat(latlngArray[0]), lng: parseFloat(latlngArray[1])};

    var location = JSON.stringify(gmapLatLng);
    
    var refreshMap;

    if ($scope.events.filteredEvents[index]) {
      if (!$scope.map.gmapMarkers[location]) {
        var alpha = $scope.alphabet.charAt(Object.keys(gmapMarkersAlpha).length);

        var marker = new google.maps.Marker({
          position: gmapLatLng,
          label: alpha,
          map: gmap
        });
        gmapMarkersAlpha[location] = alpha;
        
        if (!gmapMarkersText[location]) {
          gmapMarkersText[location] = '';
        }
        gmapMarkersText[location] += gmapMarkersTextTemplate;
        $scope.map.gmapMarkers[location] = marker;
        $scope.map.gmapMarkersCount = Object.keys($scope.map.gmapMarkers).length;
        gmapBounds.extend(marker.position);
        
        $scope.events.filteredEvents[index].mapSymbol = alpha;
    
        google.maps.event.addListener(marker, 'click', (function(marker) {
          return function() {
            gmapInfoWindow.setContent(gmapMarkersText[location]);
            gmapInfoWindow.open(gmap, marker);
          };
        })(marker));
      }
      else {
        $scope.events.filteredEvents[index].mapSymbol = gmapMarkersAlpha[location];
        gmapMarkersText[location] += gmapMarkersTextTemplate;
      }

      $timeout.cancel(refreshMap);

      refreshMap = $timeout(function() {
        google.maps.event.trigger(gmap, 'resize');
        
        var test = gmapBounds.getCenter();
  
        if (test.G != 1 && test.G !== 0) {
          gmap.fitBounds(gmapBounds);
          google.maps.event.addListenerOnce(gmap, "idle", function() { 
            if (gmap.getZoom() > 17) {
              gmap.setZoom(17);
            }
          });
        }
      }, 500);
    }
    else {
      $scope.map.label = '';
    }
  };

  $scope.gsa.gmapLookupEvents = function() {
    if ($scope.breakpoint.class != "mobile") {
      if ($scope.global.controller == "events") {
        gmapBounds = new google.maps.LatLngBounds();
        gmapInfoWindow = new google.maps.InfoWindow();

        $timeout(function() {
          $scope.gsa.gmapVisible = 0;
          google.maps.event.trigger(gmap, 'resize');
        }, 1);

        for (var item in $scope.map.gmapMarkers) {
          $scope.map.gmapMarkers[item].setMap(null);
        }
        
        $scope.map.gmapMarkers = {};
        $scope.map.gmapMarkersCount = 0;
        gmapMarkersAlpha = {};
        gmapMarkersText = {};

        for (item in $scope.events.filteredEvents) {
          var element = $scope.events.filteredEvents[item];
          if (element.location.link) {
            if (element.location.link.match("https://goo.gl/maps/")) {
              $scope.gsa.gmapExpandUrl(element.location.link, item);
            }
            else if (element.location.link.match("https://www.google.com/maps/place")) {
              var longUrlArray = element.location.link.split("/");
              $scope.events.filteredEvents[item].geocode = longUrlArray[6].substring(1, longUrlArray[6].length - 4);
//              $scope.gsa._gmapLookupEvents(item);
            }
          }
        }
      }
    }
  };

  $scope.events.filterEvents = function() {
    // events.data.events | filter:global.keywords | limitTo: 20 : events.pageOffset | orderBy:['start.datetime']

//    $scope.global.tabs[2].empty = true;
    $scope.global.loadedNotEmpty = 0;

    var typeaheadVal = "";
    typeaheadVal = $("#gsa-keywords").typeahead('val');

    if (typeaheadVal) {
      $scope.global.keywords = typeaheadVal;
    }

    $scope.events.filteredEvents = $filter('filter')($scope.events.data.events, $scope.global.keywords);
    
    if ($scope.events.filteredEvents) {
      $scope.events.total = $scope.events.filteredEvents.length;
      if ($scope.events.total) {
//        $scope.global.tabs[2].empty = false;
        $scope.global.loadedNotEmpty = 1;
      }

      $scope.events.filteredEvents = $filter('orderBy')($scope.events.filteredEvents, "start.datetime");
      
      eventOldest = new Date();
      eventLatest = new Date();
      
      for (var i in $scope.events.filteredEvents) {
        var tf = new Date($scope.events.filteredEvents[i].start.longdate);
        var tt = new Date($scope.events.filteredEvents[i].end.longdate);
  
        if (tf < eventOldest) {
          eventOldest = tf;
        }
        if (tt > eventLatest) {
          eventLatest = tt;
        }
      }
      $scope.minDate = $filter('date')(eventOldest, "MM/dd/yyyy");
      $scope.maxDate = $filter('date')(eventLatest, "MM/dd/yyyy");
    }
  };
  
  $scope.events.more = function() {
    $scope.events.limit += 50;
    $scope.events.filterEvents();

    $scope.gsa.gmapLookupEvents();
  };

  angular.element(document).ready(function () {
    /* initializes breakpoint properly on mobile */
    angular.element(window).triggerHandler("resize");

    var engine = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: '/gsa-search-suggest.php?q=%QUERY',
        wildcard: '%QUERY'
      }
    });

    $('#gsa-keywords').typeahead({
      hint: false,
      highlight: true,
      minLength: 1,
      classNames: {
        menu: 'tt-menu col-sm-8'
      }
    }, {
      name: 'keywords',
      source: engine,
      templates: {
        suggestion: function (data) {
          return "<div>" + data + "<span class='ss-icon ss-upleft visible-xs-inline'></span></div>";
        },
        footer: function (data) {
          output = '<div id="tabbed-search">';
          for (var i in $scope.global.tabs) {
            if (!$scope.global.tabs[i].external) {
              output += '<div><a href="/'+ $scope.global.tabs[i].path +'/'+ data.query +'" onClick="$(\'#gsa-keywords\').typeahead(\'close\').blur()"><strong>'+ data.query +'</strong> in <span>'+ $scope.global.tabs[i].label +'</span></a></div>';
            }
            else {
              output += '<div><a href="'+ $scope.global.tabs[i].path +'/'+ data.query +'" onClick="$(\'#gsa-keywords\').typeahead(\'close\').blur()"><strong>'+ data.query +'</strong> in <span>'+ $scope.global.tabs[i].label +'</span></a></div>';              
            }
          }
          output += '</div>';
          return output;
        },
        notFound: function (data) {
          output = '<div id="tabbed-search">';
          for (var i in $scope.global.tabs) {
            if (!$scope.global.tabs[i].external) {
              output += '<div><a href="/'+ $scope.global.tabs[i].path +'/'+ data.query +'" onClick="$(\'#gsa-keywords\').typeahead(\'close\').blur()"><strong>'+ data.query +'</strong> in <span>'+ $scope.global.tabs[i].label +'</span></a></div>';
            }
            else {
              output += '<div><a href="'+ $scope.global.tabs[i].path +'/'+ data.query +'" onClick="$(\'#gsa-keywords\').typeahead(\'close\').blur()"><strong>'+ data.query +'</strong> in <span>'+ $scope.global.tabs[i].label +'</span></a></div>';
            }
          }
          output += '</div>';
          return output;
        }
      }
    }).on("typeahead:select", function(data, selected) {
      data.preventDefault();

      $timeout(function() {
        $("#search-submit").focus().blur();
        $scope.global.keywords = $("#gsa-keywords").typeahead('val');
        $scope.gsa.searchSubmit();
      }, 0);
    }).on("typeahead:change", function(data, value) {
      $timeout(function() {
        $scope.global.keywords = value;
      }, 0);
    }).on("typeahead:open", function(data) {
      $("body").addClass("search-focus");
    }).on("typeahead:close", function(data) {
      $("body").removeClass("search-focus");
    });

		$('#mobile-nav-container').dlmenu({
      animationClasses : { classin : 'dl-animate-in-5', classout : 'dl-animate-out-5' },
		});

  });


}]);

gsaControllers.controller('landing', ['$scope', '$http', '$timeout', '$location', function($scope, $http, $timeout, $location) {
  $scope.global.path = $location.path();
  $scope.global.pageTitle = $scope.global.pageTitleDefault;

//  $scope.gsa.initMap();
  
  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};
}]);

gsaControllers.controller('gsaPages', ['$scope', '$routeParams', '$http', '$timeout', '$location', function($scope, $routeParams, $http, $timeout, $location) {
  $scope.global.path = $location.path();
//  $scope.gsa.initMap();

  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};
  
  $scope.global.keywords = $routeParams.term;

  $scope.global.pageTitle = '"' + $scope.global.keywords + '" - ' + $scope.global.pageTitleDefault;

  $scope.global.initSearch();

  if ($scope.global.keywords && $routeParams.page) {
    $scope.gsa.paginationPage = $routeParams.page;

    var params = getBaseParams();

    params.start = ($scope.gsa.paginationPage - 1) * 10;

    $scope.global.keywordsSubmitted = $scope.global.keywords;

    _gsaSearchQuery(params);
  }
  else {

    $scope.gsa.searchQuery();
  }

  $scope.pageChange = function() {
    $location.path('/pages/' + $scope.global.keywords + '/' + $scope.gsa.paginationPage);
  };

}]);

gsaControllers.controller('gsaDocuments', ['$scope', '$routeParams', '$http', '$timeout', '$location', function($scope, $routeParams, $http, $timeout, $location) {
  $scope.global.path = $location.path();
  $scope.gsa.gmapVisible = 0;
  $scope.gsa.gmapFocus = 0;
  $scope.map.label = '';

  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};

  $scope.global.keywords = $routeParams.term;
  $scope.global.pageTitle = '"' + $scope.global.keywords + '" - Columbia University Documents';

  $scope.global.initSearch();

  if ($scope.global.keywords && $routeParams.page) {
    $scope.gsa.paginationPage = $routeParams.page;

    var params = getBaseParams();

    params.start = ($scope.gsa.paginationPage - 1) * 10;

    $scope.global.keywordsSubmitted = $scope.global.keywords;

    _gsaSearchQuery(params);
  }
  else {

    $scope.gsa.searchQuery();
  }

  $scope.pageChange = function() {
    $location.path('/documents/' + $scope.global.keywords + '/' + $scope.gsa.paginationPage);
  };
}]);

gsaControllers.controller('gsaMedia', ['$scope', '$routeParams', '$http', '$timeout', '$location', function($scope, $routeParams, $http, $timeout, $location) {
  $scope.global.path = $location.path();
  $scope.gsa.gmapVisible = 0;
  $scope.gsa.gmapFocus = 0;
  $scope.map.label = '';
  $scope.selected = -1;

  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};

  $scope.global.keywords = $routeParams.term;
  $scope.global.pageTitle = '"' + $scope.global.keywords + '" - Columbia University Media';

  $scope.global.initSearch();


  $scope.gsa.searchQuery();

  $scope.mediaSelect = function(index) {
    $scope.selected = index;

    $('#image-carousel').carousel(index);
    
    $timeout(function() {
      carouselPosition = $("#image-carousel").position().top;
      $("html, body").stop().animate({scrollTop: carouselPosition}, '200', 'swing');
    }, 200);
  };

  $scope.mediaUpdate = function(step) {
    var lastIndex = $scope.gsa.data.results.length - 1;

    if (step == 'prev') {
      if ($scope.selected === 0) {
        $scope.selected = lastIndex;
      }
      else {
        $scope.selected--;
      }
    }
    else if (step == 'next') {
      if ($scope.selected == lastIndex) {
        $scope.selected = 0;
      }
      else {
        $scope.selected++;
      }
    }
    else {
      $scope.selected = step;
    }
  };

  angular.element(document).ready(function () {
    $timeout(function() {
      $('#image-carousel').carousel({
        interval: false
      });
    }, 0);
  });

  var mediaDestroy = $scope.$on('$destroy', function() {
    $('#image-carousel').off('slide.bs.carousel');

    mediaDestroy();
  });

}]);

gsaControllers.controller('people', ['$scope', '$routeParams', '$http', '$timeout', '$location', function($scope, $routeParams, $http, $timeout, $location) {
  $scope.global.path = $location.path();
  $scope.gsa.gmapVisible = 0;
  $scope.gsa.gmapFocus = 0;
  $scope.map.label = '';

  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};

  $scope.global.keywords = $routeParams.term;
  $scope.global.pageTitle = '"' + $scope.global.keywords + '" - Columbia University People';

  $scope.global.initSearch();

  $scope.gsa.searchPeopleQuery();
}]);

gsaControllers.controller('publications', ['$scope', '$routeParams', '$http', '$timeout', '$location', '$filter', 'Publications', 'People', function($scope, $routeParams, $http, $timeout, $location, $filter, Publications, People) {
  $scope.global.path = $location.path();
  $scope.gsa.gmapVisible = 0;
  $scope.gsa.gmapFocus = 0;
  $scope.map.label = '';

  $scope.gsa.lastParams = {};
  $scope.gsa.data = {};

  $scope.global.keywords = $routeParams.term;

  if ($scope.global.keywords) {
    $scope.global.pageTitle = '"' + $scope.global.keywords + '" - Columbia University Publications';

  }
  else {
    $scope.global.pageTitle = "Columbia University Search Publications";

  }

  $scope.global.initSearch();

  if ($routeParams.type != "q") {
    $scope.type = $routeParams.type;
  }
  else { /* If type needs to be determined */
    if ($scope.global.searchType == "UNI" && $scope.global.keywords) {
      $location.path('/publications/person/' + $scope.global.keywords, true).replace(); /* ..and remove q from history */
    }
    else {
      var keywords = ($scope.global.keywords) ? $scope.global.keywords : "";
      $location.path('/publications/keyword/' + keywords, true).replace(); /* ..and remove q from history */
    }
  }

  $scope.global.keywordsSubmitted = $scope.global.keywords;
  
  $scope.noResults = 0;
  $scope.itemFocus = {};
  $scope.uniFilter = [];

  $scope.stringToDate = function(input) {
    output = new Date(input);
    return $filter('date')(output, 'MMMM d, yyyy');
  };
  
  $scope.setItemFocus = function(i) {
    for (var j in $scope.itemFocus) {
      if (j != i) {
        $scope.itemFocus[j] = 0;
      }
    }

    if (!$scope.itemFocus[i]) {
      $scope.itemFocus[i] = 1;
    }
    else {
      $scope.itemFocus[i] = 0;
    }
    
    $scope.uniFilter = [];
    $scope.uniFilterActive = 0;
    for (j in $scope.itemFocus) {
      if ($scope.itemFocus[j] == 1) {
        $scope.uniFilterActive = 1;
        if ($scope.publications[j].uid) {
          uniGroup = $scope.publications[j].uid.split(", ");

          $scope.uniFilter = $scope.uniFilter.concat(uniGroup);
        }
      }
    }

    $scope.peopleFiltered = $filter('inArray')($scope.people, $scope.uniFilter, 'uni', $scope.uniFilterActive);

    if ($scope.uniFilterActive == 1 && $scope.itemFocus[i] == 1) {
      $timeout(function() {
        var currentScrollY = $("#gsa-search-results li:eq("+ i +")").position().top;
        
        $("#gsa-search-people").stop().animate({
          top: currentScrollY
        }, 100);
      }, 150);
    }
    else {
      $("#gsa-search-people").stop().animate({
        top: 0
      }, 100);      
    }
  };

  $scope.filteredUni = function () {
    return $scope.publications.filter(function (uni) {
      return $scope.uniFilter.indexOf(uni) !== -1;
    });
  };

  $scope.searchPublications = function() {
    $scope.noResults = 0;

    var query;
    if ($scope.type == "keyword") {
      query = Publications.fetch($scope.global.keywords, 50);
    }
    else {
      query = Publications.fetchUni($scope.global.keywords, 100);
      $scope.global.searchType = "UNI";
    }

    query.then(function(result) {
      $scope.global.loaded = 1;

      if (result) {
        if (result.length) {
          result = $filter('filter')(result, $scope.global.keywords);
          $scope.global.loadedNotEmpty = 1;
        }
        else {
          result = [result];
        }
      }

      if (result) {
        var unis = [];

        if (result.length) {
          $scope.noResults = 0;
  
          for (var i in result) {
            result[i].date = $scope.stringToDate(result[i].pubDate);
            if (result[i].uid) {
              unis.push(result[i].uid);
            }
          }
        }
        else {
          $scope.noResults = 1;
        }

        if (unis.length) {
          /* Parallel people search */
          var peopleQueryParams = {
            term: unis.join(",").replace(" ","")
          };
    
          People.queryUni(peopleQueryParams).then(function(data) {        
            $scope.people = data;
            $scope.peopleFiltered = $scope.people;
            $scope.peopleFiltered = $filter('orderBy')($scope.peopleFiltered, ['sn', 'givenname']);
          });
        }

      }
      else {
        $scope.noResults = 1;
      }

      $scope.publications = result;
    });
  };

  $scope.searchPublications();
}]);

gsaControllers.controller('events', ['$scope', '$routeParams', '$http', '$filter', '$timeout', '$location', 'dateFilter', 'Events', function($scope, $routeParams, $http, $filter, $timeout, $location, dateFilter, Events) {
  $scope.global.path = $location.path();
//  $scope.gsa.initMap();

  $scope.gsa.data = {};

  $scope.global.keywords = $routeParams.term;
  if ($scope.global.keywords) {
    $scope.global.pageTitle = '"' + $scope.global.keywords + '" - Columbia University Events';

  }
  else {
    $scope.global.pageTitle = 'Columbia University Search Events';

  }

  $scope.global.initSearch();

  $scope.global.loaded = 0;
  $scope.global.loadedNotEmpty = 0;
  
  $scope.time = new Date();
  $scope.renderDate = function(input) {
    date = new Date(input);
    output = $filter('date')(date, "'<div class=\"month\">'MMM'</div><div class=\"day\">'d'</div><div class=\"weekday\">'EEE'</div>'");

    return output;
  };
  $scope.renderRelativeDate = function(element) {
    var input = element.start.longdate + ' ' + element.start.time;
    var enddate = new Date(element.end.longdate + ' ' + element.end.time);

    date = new Date(input);

    if (date < $scope.time) {
      if (enddate < $scope.time) {
        output = '<time>Ended ' + $filter('amTimeAgo')(enddate) + '</time>';
      }
      else {
        output = '<time>Started ' + $filter('amTimeAgo')(date) + '</time>';
        output += ', <time>ends ' + $filter('amTimeAgo')(enddate) + '</time>';        
      }
    }
    else {
      output = '<time>Starts ' + $filter('amTimeAgo')(date) + '</time>';
    }

    return output;
  };
  
  $scope.toggleMap = function(item, state) {
    if (state === false || state === true) {
      item.mapShown = state;
    }
    else {
      item.mapShown = !item.mapShown;
    }
  };

  $scope.dateReset = function() {
    $scope.date = [];

    $('.pickadate-active').removeClass('pickadate-active');
  };

  Events.retrieve().then(function(result) {
    $scope.global.loaded = 1;
    
    $scope.events.data = result;

    $scope.events.filterEvents();
    $scope.events.searchEvents();
  });

  $scope.$watch("date", function(value) {
    if (value) {
      if (typeof value === 'string') {
        $scope.events.limit = 200;
      }
      else {
        $scope.events.limit = 20;
      }
    }
  });

  var eventsDestroy = $scope.$on('$destroy', function() {
    $scope.events.data = {};

    eventsDestroy();
  });
}]);











