'use strict'

var dataCollections = {
	hot:[],
	top:[],
	new:[]
};
var timeAnchor = -1;
var totals = false;
var activeType = 'hot';
var activeData = dataCollections.hot;
var xDataBounds = [0,1440];
var yDataBounds = [0,0];
var altYDataBounds = [0,0];
var altYDataMax = 0;
var chartWidth = 1000;
var chartHeight = 500;
var chartOffset = [50,50];
var yDataMax = 0;
var drawTimeout;

function processData(d, dataCollection, type)
{
	var data = [];
	var now = new Date();
	var nowTime = now.getHours()*60 + now.getMinutes();
	var posts = d.data.children;
	for(var c = 0;c<posts.length;c++){
		var post = posts[c];
		var date = new Date(post.data.created_utc*1000);
		var postTime = msToTimeValue(now.valueOf()-post.data.created_utc*1000);
		data.push({time:{hours:date.getHours(), minutes:date.getMinutes()}, aliveTime:postTime, upRatio:(post.data.ups/(now-post.data.created_utc*1000))*1000, ups:post.data.ups, permalink:post.data.permalink});
	}
	dataCollection.push({time:Date.now(), data:data});
	
	if(type == activeType && timeAnchor == dataCollection.length-2)
	{
		moveTimeAnchor(1);
		activeData = dataCollection[timeAnchor];
		draw(activeData, totals);
	}
}

function hoverText(index){
	var data = activeData.data;
	var minutes = data[index].time.minutes;
	if(minutes<10)
		minutes = '0'+minutes;
	var aliveMinutes = data[index].aliveTime%60;
	if(aliveMinutes<10)
		aliveMinutes = '0'+aliveMinutes;
	document.querySelector('#hoverText').innerHTML = '<strong>Permalink (click to open)</strong> '+data[index].permalink+'<br><strong>Time posted</strong> '+data[index].time.hours+':'+minutes+'<br><strong>Time alive</strong> <span style="font-size:8pt;"><em>hh:mm</em></span> '+Math.floor(data[index].aliveTime/60)+':'+aliveMinutes+'<br><strong>Upvotes per second</strong> '+Math.round(data[index].upRatio*1000)/1000+'<br><strong>Upvotes</strong> '+data[index].ups;
}

function getYCoord(upRatioValue, alt){
	return (chartHeight-chartOffset[1]) - (upRatioValue/((alt) ? altYDataBounds[1] : yDataBounds[1]))*(chartHeight-chartOffset[1]);
}
function getXCoord(timeValue)
{
	return (((timeValue)/xDataBounds[1])*(chartWidth - chartOffset[0]))+chartOffset[0];
}

function draw(data, alt){
	document.querySelector('#timeAnchor').innerHTML = 'Data captured at '+new Date(data.time);
	var now = new Date(data.time);
	var nowTime = now.getHours()*60 + now.getMinutes();
	data = data.data;
	//yDataBounds = [0,0];
	//yDataMax = 0;
	for(var c = 0;c<data.length;c++){
		if(data[c].upRatio>yDataBounds[1])
			yDataBounds[1] = Math.ceil(data[c].upRatio*10)/10;
		if(data[c].upRatio>yDataMax)
			yDataMax = data[c].upRatio;
		if(data[c].ups>altYDataBounds[1])
			altYDataBounds[1] = Math.ceil(data[c].ups/100)*100;
		if(data[c].ups>altYDataMax)
			altYDataMax = data[c].ups;
		//if(data[c].upRatio<yDataBounds[0])
		//	yDataBounds[0] = data[c].upRatio;
	}

	var svg = d3.select('#graph');
	svg.selectAll("*").remove();
	for(var c = 0;c<data.length;c++){
		var post = data[c];
		var xCoord = getXCoord(post.time.hours*60 + post.time.minutes);
		svg.append('line')
			.attr('x1',xCoord)
			.attr('x2',xCoord)
			.attr('y1',getYCoord(post.ups,true))
			.attr('y2', getYCoord(post.upRatio,false))
			.attr('stroke-width',.2)
			.attr('stroke','blue');
		svg.append('circle')
			.attr('cx',xCoord)
			.attr('cy',getYCoord((alt) ? post.ups : post.upRatio, alt))
			.attr('r', 3)
			.attr('fill', 'blue')
			.attr('onmouseover','hoverText('+c+')')
			.attr('class','hoverable')
			.attr('onclick',"window.open('https://reddit.com'+activeData.data["+c+"].permalink)");
	}
	var nowCoord = getXCoord(nowTime);
	svg.append('line')
		.attr('x1',nowCoord)
		.attr('x2',nowCoord)
		.attr('y1',0)
		.attr('y2', chartHeight/10-15)
		.attr('stroke-width',.5)
		.attr('stroke','black');
	svg.append("text")
		.attr('x',nowCoord)
		.attr('y', chartHeight/10)
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.text('Now')
		.attr('writing-mode','tb-rl')
		.attr('font-size','8pt')
		.attr('color','grey');
	svg.append('line')
		.attr('x1',nowCoord)
		.attr('x2',nowCoord)
		.attr('y1',chartHeight/10+10)
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
		.attr('x',chartOffset[0]/3)
		.attr('y', (chartHeight-chartOffset[1])/2)
		.attr('text-anchor','middle')
		.attr('font-family','Tahoma')
		.attr('writing-mode','tb-rl')
		.text('Upvotes'+((alt) ? '': ' per second'));
	svg.append("text")
		.attr('x',(chartWidth-chartOffset[0])/2 + chartOffset[0])
		.attr('y', chartHeight-chartOffset[1]/3)
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.text('Time of day posted');
	svg.append("text")
		.attr('x',chartOffset[0])
		.attr('y', chartHeight-chartOffset[1]*2/3)
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.text('00:00')
		.attr('font-size','8pt');
	svg.append("text")
		.attr('x',(chartWidth-chartOffset[0])/2 +chartOffset[0])
		.attr('y', chartHeight-chartOffset[1]*2/3)
		.attr('font-family','Tahoma')
		.attr('text-anchor','middle')
		.text('12:00')
		.attr('font-size','8pt');
	for(var c = 1;c<25;c++){
		svg.append('line')
			.attr('x1',(chartWidth-chartOffset[0])*c/24 +chartOffset[0])
			.attr('x2',(chartWidth-chartOffset[0])*c/24 +chartOffset[0])
			.attr('y1',chartHeight-chartOffset[1]-((c==12 || c==24)?3:2))
			.attr('y2',chartHeight-chartOffset[1]+((c==12 || c==24)?3:2))
			.attr('stroke-width',((c==12 || c==24)?2:1))
			.attr('stroke-linecap','round')
			.attr('stroke','black');
	}
	var yScaleAnchor = (alt) ? Math.floor(altYDataMax/1000) : Math.floor(yDataMax*10);
	for(;yScaleAnchor>0;yScaleAnchor--)
	{
		var ysa = (alt) ? yScaleAnchor*1000 : yScaleAnchor/10;
		svg.append('text')
			.attr('x',chartOffset[0]*2/3)
			.attr('y', getYCoord(ysa, alt))
			.attr('font-family','Tahoma')
			.attr('text-anchor','middle')
			.attr('alignment-baseline','middle')
			.attr('font-size','8pt')
			.text((alt)?ysa/1000 +'k' : ysa);
		svg.append('line')
			.attr('x1',chartOffset[0]-3)
			.attr('x2',chartOffset[0]+3)
			.attr('y1',getYCoord(ysa, alt))
			.attr('y2',getYCoord(ysa, alt))
			.attr('stroke-width',2)
			.attr('stroke-linecap','round')
			.attr('stroke','black');
	}
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

function jsonpRequest(url){
	var script = document.createElement('script');
	script.src = url;
	script.class = 'temporary';

	document.getElementsByTagName('head')[0].appendChild(script);
}

function receiveHot(d){
	processData(d, dataCollections.hot, 'hot');
}
function receiveTop(d){
	processData(d, dataCollections.top, 'top');
}
function receiveNew(d){
	processData(d, dataCollections.new, 'new');
}

function switchCollection(collection){
	//document.querySelector("#banner").innerHTML = titleCase(collection)+' reddit post velocity by time of day posted';
	activeType = collection;
	activeData = dataCollections[collection][timeAnchor];
	draw(activeData, totals);
	var buttons = document.querySelectorAll(".sortButton");
	for(var c = 0;c<buttons.length;c++)
	{
		if(buttons[c].id == collection+"Button")
			buttons[c].style.fontWeight = 'bold';
		else
			buttons[c].style.fontWeight = 'normal';
	}
}

function switchMetric(metric){
	if(metric == 'velocity')
		totals = false;
	else if (metric == 'total')
		totals = true;
	draw(activeData, totals);
	var buttons = document.querySelectorAll(".metricButton");
	for(var c = 0;c<buttons.length;c++)
	{
		if(buttons[c].id == metric+"Button")
			buttons[c].style.fontWeight = 'bold';
		else
			buttons[c].style.fontWeight = 'normal';
	}
}

function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function moveTimeAnchor(delta){
	timeAnchor+=delta;
	if(timeAnchor>=dataCollections[activeType].length)
			timeAnchor = dataCollections[activeType].length-1;
	else if(timeAnchor<0)
		timeAnchor = 0;
}

window.onload = function(){
	fetchData();
	resizeGraph();
	document.querySelector("#hotButton").style.fontWeight = 'bold';
	document.querySelector("#velocityButton").style.fontWeight = 'bold';
	document.addEventListener('keydown', function(e){
		console.log('key');
		if(e.keyCode == 39)
			moveTimeAnchor(1);
		else if(e.keyCode == 37)
			moveTimeAnchor(-1);
		activeData = dataCollections[activeType][timeAnchor];
		draw(activeData, totals);
	});
	window.addEventListener('resize', function(){
		resizeGraph();
		draw(activeData, totals);
	});
}

function resizeGraph(){
	var rect = document.documentElement.getBoundingClientRect();
	var width = rect.width*.9;
	var svg = document.querySelector("#graph");
	if(width>1300)
	{
		chartWidth = 1300;
		chartHeight = chartWidth/2;
	}
	else if(width>500)
	{
		chartWidth = width;
		chartHeight = chartWidth/2;
	}
	else
	{
		chartWidth = 500;
		chartHeight = 250;
	}
	svg.style.width = chartWidth;
	svg.style.height = chartHeight;
}

function fetchData(){
	jsonpRequest('https://www.reddit.com/hot.json?sort=new&jsonp=receiveHot&limit=300');
	jsonpRequest('https://www.reddit.com/top.json?sort=new&jsonp=receiveTop&limit=300');
	jsonpRequest('https://www.reddit.com/new.json?sort=new&jsonp=receiveNew&limit=300');
	setTimeout(fetchData, 30000);
}