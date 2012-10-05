var _URL_ = "http://api.etsy.com/v2/public";
var _LISTING_ = "/listings/active.js";
var _KEY_ = "&api_key=22u5zgz7eze80ymvmqshkdti";
var a,b;
var OK = 1;
var ERR = -1;
var INVALID_URL = "Invalid etsy url. Can't proceed to ajax request";
var SUCC_MSG = "Ajax request succeeded";
var FAIL_MSG = "Ajax request failed";
var color_accuracy = 20;
var resultCache = new Object();


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
        requestURL : ""  //typeof String, the url to send, generated by prepareURL()
        requestOBJ : obj //typeof Filter, the filter that holds the request specification
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
            if (data.ok){
                callback(data,request.requestOBJ);
            }
            else
                err(data);
            return 1;
        }
        
    });


}


/*
 * Takes in a filter object that specifies the details of the query, and convert it into a request url
    obj required, typeof Filter
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
    url+="&color_accuracy=" + color_accuracy;
    url+="&limit=10";
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
    cache(obj,data);
}

/*
*   Takes in an object sent back from etsy.com with listings.
*   Return the most popular listings under the given filter, or undefined if no item found.
*/
function findMostPopular (data,filter) {
    if(data.count <= 0)
        return undefined;
    var l = data.results;
    var result = undefined; //the most popular listing to return for display.

    for(var i =0;i<l.length; i++){

        var o = l[i];
        
        var is_supply = o.is_supply.toLowerCase();
        var when_made = o.when_made.toLowerCase();
        var who_made = o.who_made.toLowerCase();
        var num_favorers = o.num_favorers;
        var category = o.category_path[0].toLowerCase();
        var price = o.price;
        var type = filter.filterType;
        var cat  = filter.category;
        if(
            //typeMatch
            (
                type==="all" || type === undefined ||
                (type !== undefined && type.indexOf("handmade")!== -1 && who_made===I_DID ) ||
                (type !== undefined && type.indexOf("vintage") !== -1 && vintages.indexOf(when_made) !== -1) ||
                (type !== undefined && type.indexOf("supplies")!== -1 && is_supply=== "true")
            )
            &&
            //categoryMatch
            (
                cat === "all" || cat === undefined || (cat != undefined && cat.indexOf(category)!== -1)
            )
            &&
            //price range match
            (
                (filter.minPrice===undefined && filter.maxPrice === undefined) ||
                (filter.minPrice !== undefined && isNumber(filter.minPrice) && parseFloat(price)>=parseFloat(filter.minPrice)
                    && filter.maxPrice !== undefined && isNumber(filter.maxPrice) && parseFloat(price) <= parseFloat(filter.maxPrice)) 

            )
            //num_favorer check
            &&
            (
                result === undefined || //currently no matching item yet
                result.num_favorers === undefined ||
                (num_favorers !== undefined && isNumber(num_favorers) &&
                    parseFloat(num_favorers) > parseFloat(result.num_favorers))
            )
            
        )
        {
            result = o;
        } 
    }
    return result;
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
    var filter = new Filter();
    filter.color = "0,100,60";
    filter.keyword = "book";
    filter.minPrice = "15.00";
    filter.maxPrice = "30.00";
    var result;
    sendRequest(prepareURL(filter),process);
    
    var id = setInterval(function () {
        if(readFromCache(filter) !== undefined){
            clearInterval(id);
            console.log("break");
            console.log(resultCache);
            console.log(readFromCache(filter)); 
            console.log(findMostPopular(readFromCache(filter),filter));
        }    
    }, 500);


    // do{
    //     result = readFromCache(filter);

    // }while(result === undefined)

    //console.log(result);

    //console.log(prepareURL(obj));
	//sendRequest(prepareURL(obj),print);


    /*========On mouse/keyboard event========*/
    //for each grid do:{
    // var filter = new Filter();
    // updateFilter(filter,grid,form);           //update the filter to match HTML form/grid
    // return findMostPopular(getAllListings(filter))  //return one item for display
    //}

}

function println (data) {
	console.log(data);
}

function err(data){
    console.log(FAIL_MSG);
    console.log(data);
    alert(FAIL_MSG);
}
