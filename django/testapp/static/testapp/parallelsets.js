require.config({
    shim: {
        "splunkjs/mvc/d3chart/d3/d3.v2": {
            deps: [],
            exports: "d3"
        },
        "testapp/contrib/d3.parsets": {
            deps: ["splunkjs/mvc/d3chart/d3/d3.v2"],
            exports: "d3.parsets"
        },
    }
});

// calheat!
// shows a cool looking heatmap based on different time signatures
// requires a timechart search. it dynamically guesses how to set up the
// way to show the time, but you can define any settings you want in the html
// docs: http://kamisama.github.io/cal-heatmap

define(function(require, exports, module) {

    var _ = require('underscore');
    var d3 = require("splunkjs/mvc/d3chart/d3/d3.v2");
    var SimpleSplunkView = require("splunkjs/mvc/simplesplunkview");
    var d3p = require('testapp/contrib/d3.parsets');

    require("css!testapp/parallelsets.css");

    var parallelSets = SimpleSplunkView.extend({

        className: "splunk-toolkit-parellelsets",

        options: {
            managerid: "search1",   // your MANAGER ID
            data: "preview",  // Results type

            options: {} // the default for custom heatmap options.
        },

        output_mode: "json",

        initialize: function() {
            _.extend(this.options, {
                formatName: _.identity,
            });
            SimpleSplunkView.prototype.initialize.apply(this, arguments);

            this.settings.enablePush("value");

            // whenever domain or subdomain are changed, we will re-render.
            this.settings.on("change:domain", this._onDataChanged, this);
            this.settings.on("change:subdomain", this._onDataChanged, this);
        },

        createView: function() { 
            return true
        },

        // making the data look how we want it to for updateView to do its job
        // in this case, it looks like this:
        // [(one for each in maxSeries: {timestamp1: count, timestamp2: count, ... }]
        formatData: function(data) {
            var unicode = function(d) {return d;}
            var field_list = _.pluck(this.resultsModel.data().fields, 'name');
            var datas = data;

            data = {
                'results': datas,
                'fields': field_list
            }
            return data;
        },

        updateView: function(viz, data) {
            this.$el.html('');
            viz = $("<div id='"+this.id+"_scParallelSets' class=scParallelSetsContainer>").appendTo(this.el);
            this.div_id = '#'+viz.attr('id');
            this.div = d3.select(this.div_id);
            this.curved_id = '#' + this.id + '_curved';
            this.svg_id = '#'+this.id + '_svg';
            
            this.choices = [];

            var fields = data.fields,
                fields_clone = null,
                new_fields = [],
                old_fields = [],
                i,
                field,
                t,
                partition;

            // simply destroy the old vis
            d3.select(this.svg_id).remove();
            this.chart = d3p().dimensions(fields);
            this.vis = this.div.append("svg")
                .attr("width", this.chart.width())
                .attr("height", this.chart.height())
                .attr("id", this.svg_id);

            partition = d3.layout.partition()
                .sort(null)
                .size([this.chart.width(), this.chart.height() * 5])
                .children(function (d) {
                    return d.children ? d3.values(d.children) : null;
                })
                .value(function (d) {return d.count;});

            this.vis.datum(data.results).call(this.chart);

            t = this.vis.transition().duration(500);
            t.call(this.chart.tension(0.5));
        }
    });
    return parallelSets;
});