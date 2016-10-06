'use strict'

var data = [];
var xDataBounds = [0,1440];
var yDataBounds = [0,0];
var chartWidth = 1000;
var chartHeight = 500;
var chartOffset = [100,100];

function processData(d)
{
	var now = new Date();
	var nowTime = now.getHours()*60 + now.getMinutes();
	var posts = d.data.children;
	for(var c = 0;c<posts.length;c++){
		var post = posts[c];
		var date = new Date(post.data.created_utc*1000);
		data.push({time:{hours:date.getHours(), minutes:date.getMinutes()}, aliveTime:nowTime, upRatio:(post.data.ups/(now-post.data.created_utc*1000))*1000, permalink:post.data.permalink});
	}

	for(var c = 0;c<data.length;c++){
		if(data[c].upRatio>yDataBounds[1])
			yDataBounds[1] = Math.ceil(data[c].upRatio*10)/10;
		//if(data[c].upRatio<yDataBounds[0])
		//	yDataBounds[0] = data[c].upRatio;
	}

	var svg = d3.select('#graph');
	for(var c = 0;c<data.length;c++){
		var post = data[c];
		svg.append('circle')
			.attr('cx',(((post.time.hours*60 + post.time.minutes)/xDataBounds[1])*(chartWidth - chartOffset[0]))+chartOffset[0])
			.attr('cy',(chartHeight-chartOffset[1]) - (post.upRatio/yDataBounds[1])*(chartHeight-chartOffset[1]))
			.attr('r', 3)
			.attr('fill', 'blue')
			.attr('onmouseover','hoverText('+c+')')
			.attr('class','hoverable')
			.attr('onclick',"window.open('https://reddit.com'+data["+c+"].permalink)");
	}
	svg.append('line')
		.attr('x1',((nowTime)/xDataBounds[1])*(chartWidth-chartOffset[0])+chartOffset[0])
		.attr('x2',(nowTime/xDataBounds[1])*(chartWidth-chartOffset[0])+chartOffset[0])
		.attr('y1',0)
		.attr('y2', chartHeight)
		.attr('stroke-width',1)
		.attr('stroke','grey');
	svg.append('line')
		.attr('x1',chartOffset[0])
		.attr('x2',chartWidth)
		.attr('y1',chartHeight)
		.attr('y2', chartHeight)
		.attr('stroke-width',2)
		.attr('stroke','black');
	svg.append('line')
		.attr('x1',chartOffset[0])
		.attr('x2',chartOffset[0])
		.attr('y1',0)
		.attr('y2', chartHeight)
		.attr('stroke-width',2)
		.attr('stroke','black');
}

function hoverText(index){
	var minutes = data[index].time.minutes;
	if(minutes<10)
		minutes = '0'+minutes;
	document.querySelector('#hoverText').innerHTML = 'Permalink (click to open): '+data[index].permalink+'<br>Time posted: '+data[index].time.hours+':'+minutes+'<br>Time alive: '+Math.round(data[index].aliveTime)+'<br>Upvotes per second: '+data[index].upRatio;
}

function clickDot(index){

}

function processSvg(){

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