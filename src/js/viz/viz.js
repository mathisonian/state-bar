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

function createContext(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext('2d');
}


var LineGraph = function(selector, data, images, opts) {

    var self = this;

    this.currentMean = 0.5;
    this.stateChangeFlags = {};

    if(!opts) {
        opts = {
            width: 400
        };
    }

    var width = 50;
    var height = 48;


    this.x = d3.scale.linear()
        .domain([0, 1])
        .range([0, width]);

    this.y = d3.scale.linear()
        .domain([0, 1])
        .range([height, 0]);

    this.line = d3.svg.line()
        .x(function (d) {
            return self.x(d.x);
        })
        .y(function (d) {
            return self.y(d.y);
        }).interpolate('bundle');



    // var numPoints = 20;
    // var data = [];

    // for(var i=0; i<1; i+= 1 / numPoints) {
    //     data.push({
    //         x: i,
    //         y: 0
    //     });
    // }
    
    this.area = d3.svg.area()
        .x(function(d) { return self.x(d.x); })
        .y0(height)
        .y1(function(d) { return self.y(d.y); })
        .interpolate('bundle');


    var stateSize = 48;
    var stateMap = {};

    var svg = d3.select(selector).append('svg').attr('width', 0).attr('height', 0);

    _.each(d3.entries(states), function(d) {


        var context = createContext(stateSize, stateSize);

        var canvasPath = d3.geo.path()
            .projection(null)
            .context(context);

        var path = d3.geo.path().projection(null);

        var feature = topojson.feature(d.value, d.value.objects.icon);

        canvasPath(feature);
        context.fillStyle = '#FF0000';
        context.lineWidth = 0.1;
        context.fill();


        var totalArea = 0;
        for(var y=stateSize-1; y>=0; y--) {
            for(var x=0; x < stateSize; x++) {
                var isContained = context.getImageData(x, y, 1, 1).data[0] === 255;
                if(isContained) {
                    totalArea += 1.0;
                }
            }
        }

        stateMap[d.key] = {
            context: context,
            feature: feature,
            path: path,
            totalArea: totalArea
        };

        svg.append('clipPath')
            .attr('id', 'clip-' + d.key)
            .append('path')
            .attr('d', path(feature));

    });


    var heightFromState = function(s, threshold) {
        var state = stateMap[s];

        var context = state.context;
        var totalArea = state.totalArea;
        var currentArea = 0;

        if(threshold >= 1) {
            return 1.0;
        }

        for(var y=stateSize-1; y>=0; y--) {
            for(var x=0; x < stateSize; x++) {
                var isContained = context.getImageData(x, y, 1, 1).data[0] === 255;
                var isHalf = context.getImageData(x, y, 1, 1).data[1] === 255;

                if(isHalf) {
                    currentArea += 0.0;
                } else if(isContained) {
                    currentArea += 1.0;
                }

                if(currentArea / totalArea > threshold) {
                    return (stateSize - y) / stateSize;

                }

            }
        }

        return 1.0;
    };

    _.each(d3.entries(states), function(d) {

        var svg = d3.select(selector).append('svg').attr('width', stateSize).attr('height', stateSize * 2).attr('class', 'state-svg');

        var path = stateMap[d.key].path;
        var feature = stateMap[d.key].feature;

        self.stateChangeFlags[d.key] = false;


        var target = heightFromState(d.key, self.currentMean);
        var numPoints = 20;


        var data = [];
        for(var i=0; i<1; i+= 1 / numPoints) {
            data.push({
                x: i,
                y: target
            });
        }

        var g = svg.append('g').attr('tranform', 'translate(' + (2 * stateSize) + ',0)');
        
        g.append('path')
            .datum(data)
            .attr('clip-path', 'url(#clip-' + d.key + ')')
            .attr('class', 'area')
            .attr('d', self.area);



        var time = 1000;

        setInterval(function() {

            if(self.stateChangeFlags[d.key]) {
                target = heightFromState(d.key, self.currentMean);
                self.stateChangeFlags[d.key] = false;
            }

            var ys = _.map(_.range(numPoints), function() { return Math.random() / 7; });
            var mean = _.reduce(ys, function(memo, num) { return memo + num;}, 0) / numPoints;

            ys = _.map(ys, function(num) {
                num += (target - mean);
                return num;
            });

            data = _.map(_.zip(_.range(0, 1, 1 / numPoints), ys), function(arr) {
                return {
                    x: arr[0],
                    y: arr[1]
                };
            });
            
            svg.select('.area')
                .datum(data)
                .transition()
                .ease('linear')
                .duration(time)
                .attr('d', self.area);

        }, time);

        g.append('path')
            .attr('d', path(feature))
            .style('stroke', 'black')
            .style('fill', 'none');
    });


};


module.exports = LineGraph;


LineGraph.prototype.updateMean = function(m) {
    this.currentMean = m;
    var self = this;
    _.each(this.stateChangeFlags, function(val, key) {
        self.stateChangeFlags[key] = true;
    });
};

