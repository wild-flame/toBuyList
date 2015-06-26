Items = new Mongo.Collection("items");

if (Meteor.isClient) {

    Meteor.subscribe("items");

    Template.body.helpers({
        items: function() {
            if (Session.get("hideCompleted")) {
                return Items.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
            } else {
                return Items.find({}, {sort: {createdAt: -1}});
            }
        },
        hideCompleted: function () {
            return Session.get("hideCompleted");
        },
        inCompleteSum: function() {
            var sums = 0;
            items = Items.find({checked: {$ne: true}});
            items.forEach(function(item) {
                sums += item.price;            
            })
            return sums;
        },
        completeSum: function() {
            var sums = 0;
            items = Items.find({checked: true});
            items.forEach(function(item) {
                sums += item.price;            
            })
            return sums;
        },
        totalSum: function() {
            var sums = 0;
            Items.find().forEach(function(item) {
                sums += item.price;            
            })
            return sums;
        },
        secondarySum: function() {
             var sums = 0;
            Items.find({secondary: {$ne: true}}).forEach(function(item) {
                sums += item.price;            
            })
            return sums;
        }

    });

    Template.item.helpers({
         isOwner: function() {
            return this.owner === Meteor.userId();
        }
    });

    Template.body.events({
        "submit .new-item": function(event) {
            // This function is called when the new item form is submitted

            var text = event.target.text.value;

            Meteor.call("addItem", text);

            // Clear form
            event.target.text.value = "";

            return false;
        },
        "change .hide-completed input": function (event) {
            Session.set("hideCompleted", event.target.checked);
        }
    });

    Template.item.events({
        "click .toggle-checked": function () {
            Meteor.call("setChecked", this._id, ! this.checked);
        },
        "click .delete": function () {
            Meteor.call("deleteItem", this._id);
        },
        "click .toggle-secondary": function() {
            Meteor.call("setSecondary", this._id, !this.secondary);
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

}

Meteor.methods({
    addItem: function(text) {
        if (! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }


        if (/\$/.test(text) === true) {
        // for input like "Item names, $100" 
            var price = text.match(/\$\d*/);
            console.log("price1:" + price);
            if (price === null | price === "") {
                price = 0;
            } else {
                price = number(price[0].match(/\d+/g)[0]);
            }
            var name = text.replace(/(\$\d*|\s)/g,"");
        } else {
        // for input like "Item names 100" 
            var price = text.match(/\s\d*/);
            console.log("price2:" + price);
            if (price === null | price === "") {
                price = 0;
            } else {
                price = Number(price[0].match(/\d+/g)[0]);
            }
            var name = text.replace(/(\s(\d|\s)*)/g,"");

        }

        Items.insert({
            text: name,
            price: price,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
    },

    deleteItem: function (itemId) {
        Items.remove(itemId);
    },
    setChecked: function (itemId, setChecked) {
        Items.update(itemId, { $set: {checked: setChecked} });
    },
    setSecondary: function(itemId, setToSecondary) {
        var item = Items.findOne(itemId);
        Items.update(itemId, { $set: { secondary: setToSecondary } });
    }
});

if (Meteor.isServer) {
    Meteor.publish("items", function() {
        return Items.find({});
    });
}

