//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
require("dotenv").config()

mongoose.connect(process.env.CONNECTION_URL)

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({name: "Welcome to your todolist"})
const item2 = new Item({name: "Click the plus to add an item"})
const item3 = new Item({name: "Click the checkbox to delete an item"})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)



app.get("/", function(req, res) {

  Item.find({}, function (err, results){

    if (results.length === 0){
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Success");
        }
      })

      res.redirect("/")
    }
    else{
      List.find({name: {$ne: "Favicon.ico"}}, function (err, foundList) {
        res.render("list", {listTitle: "Today", newListItems: results, foundList: foundList});
      })
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name: itemName})

  if (listName === "Today") {
    item.save()
    res.redirect("/")
  }
  else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Successfully removed");
        res.redirect("/")
      }
    })
  }
  else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName)
        }
      }
    )
  }


})

app.post("/redirect", function (req, res) {
  const listName = req.body.dropDown;
  res.redirect(listName)
})

app.post("/create", function (req, res) {
  const newListName = req.body.newListName

  res.redirect("/" + newListName)
})

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName)

  List.findOne({name: listName}, function (err, desiredList) {
    if (!err && desiredList) {
      List.find({name: {$nin: ["Favicon.ico", desiredList.name]}}, function (err, foundList) {
        res.render("list", {listTitle: desiredList.name, newListItems: desiredList.items, foundList: foundList});
      })
    }
    else {
      const list = new List({
        name: listName,
        items: defaultItems
      })
      list.save()
      res.redirect("/" + listName)

    }
  })



})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
