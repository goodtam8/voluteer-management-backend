var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db');
const { generateToken } = require('../utils/auth');



/* GET home page. */
router.get('/',async function(req, res, next) {
  
  const db = await connectToDB();
  try{
  let result = await db.collection("event").find({ highlight: "on" }).toArray();
  let eee = await db.collection("event").find().limit(3).toArray();

  if (result.length>0) {
    result[0].active = "active"
  }
  res.render('index', { event: result, ede:eee});
} catch(err){}
finally{    await db.client.close();
}

});

router.get('/become/volunteer', function(req, res, next) {//giving an url to different website
  res.render('volunteer', { title: 'Express' });// it will trigerr because they call the method
});

router.post('/register', async function (req, res) {
  const db = await connectToDB();
  try {
    req.body.terms = req.body.terms == "on";
    req.body.createdAt = new Date();
    req.body.modifiedAt = new Date();

    let query = {};
    if (req.query.email) {
      query.email = req.query.email;
    }

    let check = await db.collection("volunteer").find(query).toArray();
    if(check){
      res.status(409).json({ message: "volunteer already in database" });

    }else{
    //if (db.collection("volunteer").findOne({"email":req.body.email}).limit(1).length === 1) {    
    //}else{
    

    let result = await db.collection("volunteer").insertOne(req.body);
    res.status(201).json({ id: result.insertedId });}
  //}
  } catch (err) {
  } finally {
    await db.client.close();
  }
});
// Pagination based on query parameters page and limit, also returns total number of documents
router.get('/event', async function (req, res) {
  const db = await connectToDB();
  try {
    let page = parseInt(req.query.page) || 1;
    let perPage = parseInt(req.query.perPage) || 6;
    let skip = (page - 1) * perPage;

    let result = await db.collection("event").find().skip(skip).limit(perPage).toArray();//using for skipping for next page and remove the first page of element
    let total = await db.collection("event").countDocuments();

    res.render('event', { event: result, total: total, page: page, perPage: perPage,req:req });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
  finally {
  }
});
router.get('/event/new', function(req, res, next) {
  res.render('new', { title: 'Express' });
});
router.post('/create', async function (req, res) {
  const db = await connectToDB();
  try {
    req.body.quota = parseInt(req.body.quota);
    req.body.highlight = req.body.highlight == "on";
    req.body.createdAt = new Date();

    req.body.modifiedAt = new Date();
   

    let result = await db.collection("event").insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
  } finally {
    await db.client.close();
  }
});
/* Display a single Booking */
router.get('/event/detail/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("event").findOne({ _id: new ObjectId(req.params.id) });
    if (result) {
      res.render('detail', { event: result });
    } else {
      res.status(404).json({ message: "event not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});


router.post('/event/delete/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("event").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Event deleted" });
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

// display the update form
router.get('/event/edit/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("event").findOne({ _id: new ObjectId(req.params.id) });
    if (result) {
      res.render('edit', { event: result });
    } else {
      res.status(404).json({ message: "event not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

// Update a single Booking
router.post('/event/update/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    req.body.numTickets = parseInt(req.body.numTickets);
    req.body.terms = req.body.terms == "on";
    req.body.modifiedAt = new Date();

    let result = await db.collection("event").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "event updated" });
    } else {
      res.status(404).json({ message: "event not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

router.post('/api/login', async function (req, res, next) {
  const db = await connectToDB();
  try {
    // check if the user exists

    var user = await db.collection("volunteer").findOne({ email: req.body.email });
    if (!user) {
      res.status(401).json({ message: 'Users not found' });
      return;
    }

   // res.json(user);

delete user.password;

// generate a JWT token
const token = generateToken(user);

// return the token
res.json({ token: token });
    
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await db.client.close();
  }
});

module.exports = router;
