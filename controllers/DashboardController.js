/**
 *  Dashboard Controller
 **/

var mongoose = require('mongoose'),
	conf = require('node-config'),
	crypto = require('crypto');

// Models
var Settings = mongoose.model('Settings'),
	ActivityItem = mongoose.model('ActivityItem');

exports.controller = function(req, res, next) {
	Controller.call(this, req, res, next);
	var self = this;
	
	self.nav_items = [{group: "default", url: "/dashboard/top", text: "Top Posts"}];
	
	self.layout = "dashboard";
	
	self.index = function() {
		if (!req.require_authentication("/dashboard")) { return; }
		
		var activity_items = [];
		var where = {analyzed_at: {"$gt": new Date(Date.now()-86400*1000)}};
		if (req.query.since) {
			where["posted_at"] = {"$gt": new Date(parseInt(req.query.since)*1000)};
		}
		// We can limit tweets to only people you follow (good for hiding RTs)
		// HOWEVER: With Twitters API, GET statuses/show/:id seems to return "following: null" (sometimes?)
		// So to determine that we do or do not follow a user, we would need to dispatch another request..
		where["attributes.is_friend"] = true;
		
		var settings = {name: "dashboard", ratings: {"$exists": 1}, sort_by: "int_posted_at desc", url: "/dashboard.json"};
		ActivityItem.find(where)
		.sort("posted_at", -1)
		.limit(20)
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
			
			switch (req.params.format) {
				case 'json':
					res.send(activity_items);
					break;
				default:
					res.render("objects/stream", {
						layout: self.layout,
						activity_items: activity_items, 
						stream: settings
					});
			}
		});
	}
	// end /dashboard/index
	
	self.top = function () {
		var activity_items = [];
		
		var settings = {name: "dashboard", sort_by: "rating desc", url: ""};
		
		ActivityItem.find({posted_at: {"$gt": new Date(Date.now()-86400*1000/6)}})
		.sort("ratings.overall", -1)
		.limit(50)
		.populate("user")
		.populate("characteristics")
		.populate("topics")
		.run(function (err, items) {
			if (!err && items && items.length > 0) {
				activity_items = items;
			}
			
			res.render("objects/stream", {
				layout: self.layout, 
				activity_items: activity_items, 
				stream: settings
			});
		});
	}
	// end /dashboard/top
};