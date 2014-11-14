'use strict';

var _ = require('lodash');
var utils = require('../utils');
var htmlContent = require('../../templates/includes/desktop-content.jade');
var Viz = require('../viz/viz');

/*
 * View controller
 */
function DesktopViewController($el) {
    if (!(this instanceof DesktopViewController)) {
        return new DesktopViewController($el);
    }

    this.$el = $el;
    this.$el.html(htmlContent({
        // template variables go here
        // e.g.
        //
        // someVar: something
    }));


    // maybe you want to instantiate a vizualization:
    //
    var viz = new Viz(this.$el.find('.viz')[0]);

    var self = this;

    this.$el.find('.range-container').find('input[type=range]').on('change mousemove', _.throttle(function() {
        var val = $(this).val();
        self.$el.find('span#fill-percentage').html(val);
        viz.updateMean(val / 100);
    }, 300));
}



DesktopViewController.prototype.destroy = function() {
    this.$el.find('*').unbind().html();
};

module.exports = DesktopViewController;
