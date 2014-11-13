'use strict';
var d3 = require('d3');
var topojson = require('topojson');
var _ = require('lodash');
var utils = require('lightning-client-utils');
var states = require('../data/states.json');

var margin = {
    top: 0,
    right: 20,
    bottom: 0,
    left: 45
};

var LineGraph = function(selector, data, images, opts) {

    var self = this;

    if(!opts) {
        opts = {
            width: 400
        };
    }

    var width = (opts.width || $(selector).width()) - margin.left - margin.right;
    var height = (opts.height || (width * 0.6)) - margin.top - margin.bottom;

    data = data || [];


    this.x = d3.scale.linear()
        .domain([0, 1])
        .range([0, width]);

    this.y = d3.scale.linear()
        .domain([0, 2])
        .range([height, 0]);

    this.line = d3.svg.line()
        .x(function (d) {
            return self.x(d.x);
        })
        .y(function (d) {
            return self.y(d.y);
        }).interpolate('bundle');


    var svg = d3.select(selector)
        .append('svg:svg')
        .attr('class', 'line-plot')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('svg:g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');



    var numPoints = 20;
    var data = [];

    for(var i=0; i<1; i+= 1 / numPoints) {
        data.push({
            x: i,
            y: 1
        });
    }
    
    this.area = d3.svg.area()
        .x(function(d) { return self.x(d.x); })
        .y0(height)
        .y1(function(d) { return self.y(d.y); })
        .interpolate('bundle');


    svg.append('path')
        .datum(data)
        .attr('class', 'area')
        .attr('d', self.area);

    svg.append('path')
        .datum(data)
        .attr('class', 'line')
        // .attr('stroke', 'none')
        .style('fill', 'none')
        .attr('d', self.line);


  // svg.append("linearGradient")
  //     .attr("id", "water-gradient")
  //     .attr("gradientUnits", "userSpaceOnUse")
  //     .attr("x1", 0)
  //     .attr("y1", self.y(0))
  //     .attr("x2", 0)
  //     .attr("y2", self.y(2))
  //     .selectAll("stop")
  //     .data([
  //       {offset: "0%", color: "#121438"},
  //       {offset: "100%", color: "#145ef2"}
  //     ])
  //   .enter().append("stop")
  //     .attr("offset", function(d) { return d.offset; })
  //     .attr("stop-color", function(d) { return d.color; });


    var time = 1000;
    var hitMean = 1; 
    setInterval(function() {

        var ys = _.map(_.range(numPoints), function() { return Math.random() / 3; });
        var mean = _.reduce(ys, function(memo, num) { return memo + num;}, 0) / numPoints;

        ys = _.map(ys, function(num) {
            num += (hitMean - mean);
            return num;
        });

        hitMean -= 0.05;

        data = _.map(_.zip(_.range(0, 1, 1 / numPoints), ys), function(arr) {
            return {
                x: arr[0],
                y: arr[1]
            }
        });

        svg.select('.line')
            .datum(data)
            .transition()
            .ease('linear')
            .duration(time)
            .attr('d', self.line);
        
        svg.select('.area')
            .datum(data)
            .transition()
            .ease('linear')
            .duration(time)
            .attr('d', self.area);

    }, time);

    // this.svg = svg;
    // this.zoomed = zoomed;
    // this.updateAxis = updateAxis;
    // this.data = data;
    var path = d3.geo.path()
    .projection(null);


    var stateSize = 48;


      d3.select("body").selectAll(".state")
      .data(d3.entries(states))
    .enter().append("div")
      .attr("class", "state")
      .text(function(d) { return d.key; })
    .append("svg")
      .attr("width", stateSize)
      .attr("height", stateSize)
    .append("path")
      .datum(function(d) { return topojson.feature(d.value, d.value.objects.icon); })
      .attr("d", function(d) {
        var p = path(d);
        console.log(path.area(d));
        var commands = p.split(/(?=[LMC])/);

        var pointArrays = commands.map(function(d){
            var pointsArray = d.slice(1, d.length).split(',');
            var pairsArray = [];
            for(var i = 0; i < pointsArray.length; i += 2){
                pairsArray.push([+pointsArray[i], +pointsArray[i+1]]);
            }
            return pairsArray;
        });

        // console.log(pointArrays);

        return p;
        });

};


module.exports = LineGraph;

