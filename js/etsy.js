var _URL_ = "http://api.etsy.com/v2/public";
var _LISTING_ = "/listings/active.js";
var _KEY_ = "&api_key=22u5zgz7eze80ymvmqshkdti";
var a,b;
var OK = 1;
var ERR = -1;
var INVALID_URL = "Invalid etsy url. Can't proceed to ajax request";
var SUCC_MSG = "Ajax request succeeded";
var FAIL_MSG = "Ajax request failed";

var resultCache;

//when_made
var vintages = [
    "1980s", "1970s", "1960s", "1950s", "1940s", "1930s", "1920s", "1910s", "1900s", "1800s", "1700s", "before_1700"
];

//who_made
var I_DID = "i_did";

/*
*  A class represents a filter in accordance to html form
   This will then be rendered and sent as a request to etsy.com to retrieve cooresponding products
*/
function Filter () {
    this.color = undefined;//hsv string,required
    
    //all options below are optional
    this.keyword = undefined;
    this.category = undefined;
    this.filterType = undefined;
    this.minPrice = undefined;
    this.maxPrice = undefined;
}

Filter.prototype.key = function() {
    return this.color+this.keyword+
            "min:"+ this.minPrice +
            "max:"+ this.maxPrice +
            "type:"+this.filterType +
            "category:"+this.category;
};


/*
    Send one ajax request to etsy.com with the given request parameter and callback function
    request should be of the following form
    request = {
        requestURL : ""  //String, the url to send, generated by prepareURL()
        requestOBJ : obj //Filter, the filter that holds the request specification
    }
*/
function sendRequest(request,callback) {
    if(request === undefined
        || request.requestURL===undefined
        || request.requestOBJ===undefined) 
        return;
    var etsyURL = request.requestURL;
    $.ajax({
        url: etsyURL,
        dataType: 'jsonp',
        success: function(data) {
            a = new Date().getTime();
            console.log(a-b);
            if (data.ok)
                callback(data,request.requestOBJ);
            else
                err(data);
        }
        
    });

}

/*
 * Takes in a filter object that specifies the details of the query
 */
function prepareURL (obj) {
    //category and type are processed after the query,so they are not embedded in the request url
    //only color is required

    var url = _URL_ + _LISTING_ + "?" + _KEY_;
    if(obj === undefined) return;
    if(obj.color === undefined) return; 
    if(obj.keyword !== undefined && obj.keyword.trim().length >0){
        url+= "&keyword="+obj.keyword.trim();
    }
    if(obj.minPrice !== undefined){
        var minPrice = obj.minPrice.trim();
        if(isNumber(minPrice)){
            minPrice = parseFloat(minPrice);
            if(minPrice>=0 && minPrice < Number.MAX_VALUE)
                url+= "&min_price="+minPrice;
        }
    }
    if(obj.maxPrice !== undefined){
        var maxPrice = obj.maxPrice.trim();
        if(isNumber(maxPrice)){
            maxPrice = parseFloat(maxPrice);
            if(maxPrice>=0 && maxPrice < Number.MAX_VALUE
                && (minPrice===undefined || minPrice <= maxPrice))
                url+= "&max_price="+maxPrice;
        }
    }
    url+= "&color="+obj.color.trim();
    url+="&color_accuracy=20";
    url+="&limit=50";
    console.log(url);
    return {
        requestURL : url,
        requestOBJ : obj
    };

}


/*
* Checked if this filter obj is cached
*/
function isCached (obj) {
    return obj!==undefined && resultCache[obj.key()]!==undefined;
}

/*
* Put the obj into the cache 
*/
function cache(obj,result){
    if(obj===undefined) return;
    resultCache[obj.key()] = result;
}

/*
* Read the result for the given obj from the cache
*/
function readFromCache (obj) {
    if(obj === undefined) return undefined;
    return resultCache[obj.key()];
}

/*
* Process the data sent back from etsy and put it in the cache.
* This is the callback function to any ajax calls to etsy.com
*/
function process (data,obj) {

    if(data === undefined)
        alert( "No data return from ajax request. Fatal." );
    if(obj === undefined)
        alert( "No filter found to process the returned data. Fatal." );
    console.log(obj);
    console.log(data);
    console.log(data.results);
    cache(obj,data);
}

/*
*   Takes in an object sent back from etsy.com with listings.
*   Return the most popular listings under the given filter, or undefined if no item found.
*/
function findMostPopular (data,filter) {
    if(data.count <= 0)
        return "No matches found";
    var l = data.results;
    var result; //the most popular listing to return for display.

    for(var i =0;i<l.length; i++){

        var o = l[i];
        if(result === undefined){
            result = o;
            continue;
        }
        var category_id = o.category_id;
        var is_supply = o.is_supply;
        var when_made = o.when_made;
        var who_made = o.who_made;
        var num_favorers = o.num_favorers;
        var category = getCategory(category_id);

        if(num_favorers === undefined 
            || !isNumber(num_favorers)
            || result.num_favorers === undefined
            || !isNumber(result.num_favorers)){
            continue;
        }   
    }
}

/*
* Get the category from the given category id
*/
function getCategory (cid) {
    
}

/*
* Check if n is a number
*/
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


/*
* Get the result(the hottest item) for display given the filter specification
*/
function getAllListings(filter) {
    if(filter === undefined) return undefined;

    if(!isCached(filter))
        sendRequest(prepareURL(filter), process);
    return readFromCache(filter);   

}

function run () {
    b = new Date().getTime();
    console.log(b);
    var obj = {
        keyword : "book",
        color : "50,50,60",
        minPrice : "999999.00"
    };
    //console.log(prepareURL(obj));
	sendRequest(prepareURL(obj),print);

    /*========On mouse/keyboard event========*/
    //for each grid do:{
    // var filter = new Filter();
    // updateFilter(filter,grid,form);           //update the filter to match HTML form/grid
    // return findMostPopular(getAllListings(filter))  //return one item for display
    //}

}

function print (data) {
	console.log(data);
}

function err(data){
    console.log(FAIL_MSG);
    console.log(data);
    alert(FAIL_MSG);
}
