/* jshint: onecase */
/**
 *  Gallery Controller
 **/

var mongoose = require('mongoose'),
  url = require('url'),
  conf = require('node-config');

var Settings = mongoose.model('Settings'),
  ActivityItem = mongoose.model('ActivityItem'),
  Identity = mongoose.model('Identity'),
  Characteristic = mongoose.model('Characteristic');

exports.controller = function(req, res, next) {
  Controller.call(this, req, res);
  var self = this;

  self.nav_items = [{group: "default", url: "/gallery", text: "Gallery"}];

  self.layout = "dashboard";

  self.index = function () {

    if (!req.require_authentication("/dashboard")) { return; }

    var activity_items = [];
    var where = {analyzed_at: {"$gt": new Date(Date.now()-86400*1000)}, "media.type": "photo", "ratings.overall": {"$gte": 0.0}};
    if (req.query.since) {
      where.created_at = {"$gt": new Date(parseInt(req.query.since, 10)*1000)};
    }

    var settings = {name: "gallery", type: "gallery", sort_by: "int_created_at desc", url: "/gallery.json"};
    ActivityItem.find(where)
    .sort("created_at", -1)
    .limit(50)
    .populate("user")
    .populate("characteristics")
    .populate("topics")
    .run(function (err, items) {
      if (!err && items && items.length > 0) {
        //activity_items = items;
        items.forEach(function (item) {
          var a = item.toObject();
          a.data = null;
          activity_items.push(a);
        });
      }

      if( req.params.format == 'json') {
        res.send(activity_items);
      } else {
        res.render("objects/stream", {
          layout: self.layout,
          activity_items: activity_items,
          stream: settings
        });
      }
    });
  };
};
