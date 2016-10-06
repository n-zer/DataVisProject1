'use strict'

var data = [];
var xDataBounds = [0,1440];
var yDataBounds = [0,0];
var chartWidth = 1000;
var chartHeight = 500;
var chartOffset = [30,40];

function processData(d)
{
	var now = new Date();
	var nowTime = now.getHours()*60 + now.getMinutes();
	var posts = d.data.children;
	var yDataMax = 0;
	for(var c = 0;c<posts.length;c++){
		var post = posts[c];
		var date = new Date(post.data.created_utc*1000);
		var postTime = msToTimeValue(now.valueOf()-post.data.created_utc*1000);
		data.push({time:{hours:date.getHours(), minutes:date.getMinutes()}, aliveTime:postTime, upRatio:(post.data.ups/(now-post.data.created_utc*1000))*1000, permalink:post.data.permalink});
	}

	for(var c = 0;c<data.length;c++){
		if(data[c].upRatio>yDataBounds[1])
			yDataBounds[1] = Math.ceil(data[c].upRatio*10)/10;
		if(data[c].upRatio>yDataMax)
			yDataMax = data[c].upRatio;
		//if(data[c].upRatio<yDataBounds[0])
		//	yDataBounds[0] = data[c].upRatio;
	}

	var svg = d3.select('#graph');
	for(var c = 0;c<data.length;c++){
		var post = data[c];
		svg.append('circle')
			.attr('cx',getXCoord(post.time.hours*60 + post.time.minutes))
			.attr('cy',getYCoord(post.upRatio))
			.attr('r', 3)
			.attr('fill', 'blue')
			.attr('onmouseover','hoverText('+c+')')
			.attr('class','hoverable')
			.attr('onclick',"window.open('https://reddit.com'+data["+c+"].permalink)");
	}
	svg.append('line')
		.attr('x1',getXCoord(nowTime))
		.attr('x2',getXCoord(nowTime))
		.attr('y1',0)
		.attr('y2', chartHeight-chartOffset[1])
		.attr('stroke-width',.5)
		.attr('stroke','black');
	svg.append('line')
		.attr('x1',chartOffset[0])
		.attr('x2',chartWidth)
		.attr('y1',chartHeight-chartOffset[1])
		.attr('y2', chartHeight-chartOffset[1])
		.attr('stroke-width',2)
		.attr('stroke-linecap','round')
		.attr('stroke','black');
	svg.append('line')
		.attr('x1',chartOffset[0])
		.attr('x2',chartOffset[0])
		.attr('y1',0)
		.attr('y2', chartHeight-chartOffset[1])
		.attr('stroke-width',2)
		.attr('stroke-linecap','round')
		.attr('stroke','black');
	svg.append("text")
		.attr('x',chartOffset[0]/2)
		.attr('y', (chartHeight-chartOffset[1])/2)
		.attr('text-anchor','middle')
		.attr('font-family','Tahoma')
		.attr('writing-mode','tb-rl')
		.text('Upvotes per second');
	svg.append("text")
		.attr('x',(chartWidth-chartOffset[0])/2 + chartOffset[0])
		.attr('y', chartHeight-chartOffset[1]/2)
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.text('Time of day posted');
	var yScaleAnchor = Math.floor(yDataMax*10)/10;
	svg.append('text')
		.attr('x',chartOffset[0]/2)
		.attr('y', getYCoord(yScaleAnchor))
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.attr('alignment-baseline','middle')
		.attr('font-size','8pt')
		.text(yScaleAnchor);
	svg.append('line')
		.attr('x1',chartOffset[0]-3)
		.attr('x2',chartOffset[0]+3)
		.attr('y1',getYCoord(yScaleAnchor))
		.attr('y2',getYCoord(yScaleAnchor))
		.attr('stroke-width',2)
		.attr('stroke-linecap','round')
		.attr('stroke','black');
}

function hoverText(index){
	var minutes = data[index].time.minutes;
	if(minutes<10)
		minutes = '0'+minutes;
	document.querySelector('#hoverText').innerHTML = '<strong>Permalink (click to open)</strong> '+data[index].permalink+'<br><strong>Time posted</strong> '+data[index].time.hours+':'+minutes+'<br><strong>Time alive</strong> <span style="font-size:8pt;"><em>hh:mm</em></span> '+Math.floor(data[index].aliveTime/60)+':'+data[index].aliveTime%60+'<br><strong>Upvotes per second</strong> '+data[index].upRatio;
}

function getYCoord(upRatioValue){
	return (chartHeight-chartOffset[1]) - (upRatioValue/yDataBounds[1])*(chartHeight-chartOffset[1]);
}
function getXCoord(timeValue)
{
	return (((timeValue)/xDataBounds[1])*(chartWidth - chartOffset[0]))+chartOffset[0];
}

function clickDot(index){

}

function msToTimeValue(duration) {
    var milliseconds = parseInt((duration%1000)/100),
    	seconds = parseInt((duration/1000)%60),
    	minutes = parseInt((duration/(1000*60))%60),
    	hours = parseInt((duration/(1000*60*60))%24);

    //hours = (hours < 10) ? "0" + hours : hours;
    //minutes = (minutes < 10) ? "0" + minutes : minutes;
    //seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours*60+minutes;
}

function getRequest(url, callback){
	var xhttp = new XMLHttpRequest();
	xhttp.open('POST',url);
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4)
			callback(JSON.parse(xhttp.responseText));
	};
	xhttp.send();
}