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
            y: 0
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
    var curMean = 0; 
    setInterval(function() {

        var ys = _.map(_.range(numPoints), function() { return Math.random() / 3; });
        var mean = _.reduce(ys, function(memo, num) { return memo + num;}, 0) / numPoints;

        ys = _.map(ys, function(num) {
            num += (curMean - mean);
            return num;
        });

        if(curMean < hitMean) {
            curMean += 0.05;
        }


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

    var stateSize = 48;
    var stateMap = {};

    _.each(d3.entries(states), function(d) {

        var canvas = d3.select(selector).append("canvas")
            .attr('class', d.key)
            .attr('width', stateSize)
            .attr('height', stateSize);

        var context = canvas.node().getContext("2d");

        var path = d3.geo.path()
            .projection(null)
            .context(context);

        var feature = topojson.feature(d.value, d.value.objects.icon);
        var totalArea = path.area(feature);

        path(topojson.feature(d.value, d.value.objects.icon));
        context.fillStyle = 'red';
        context.fill();

        stateMap[d.key] = {
            context: context,
            path: path,
            totalArea: totalArea
        };

    });

    $('canvas').mousemove(function(e) {

        var state = $(this).attr('class');
        console.log(state);
        console.log('Total Area: ' + stateMap[state].totalArea);

        var totalArea = stateMap[state].totalArea;
        var currentArea = 0;

        var x = 0;
        var y = stateSize;
        var context = stateMap[state].context;

        var interval = setInterval(function() {
            // console.log(context.getImageData(x, y, 1, 1).data);

            var isContained = context.getImageData(x, y, 1, 1).data[0] === 255;

            if(isContained) {
                context.fillStyle = 'blue';
                context.fillRect( x, y, 1, 1 );
                currentArea++;
            } else {
                // context.fillStyle = 'green';
            }

            

            if(currentArea / totalArea >= 0.5) {
                clearInterval(interval);
            }

            x+=1;

            if(x >= stateSize) {
                x = 0;
                y--;
            }

            if(y < 0) {
                clearInterval(interval);
            }

        }, 0);


        $(this).unbind();

    });


};


module.exports = LineGraph;

