//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://aryangoel24:G0eL_duBai25@cluster0.gsp5pin.mongodb.net/todolistDB")

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
      res.render("list", {listTitle: "Today", newListItems: results});
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

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName)

  List.findOne({name: listName}, function (err, foundList) {
    if (!err && foundList) {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
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

app.listen(4000, function() {
  console.log("Server started on port 4000");
});