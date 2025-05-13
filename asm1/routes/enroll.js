var express = require('express');
var router = express.Router();
var passport = require('passport');

const { connectToDB, ObjectId } = require('../utils/db');
const { generateToken, isVolunteer, isAdmin } = require('../utils/auth');


module.exports = router;


router.post('/', async function (req, res) {
    const db = await connectToDB();
    try {
        req.body.terms = req.body.terms ? true : false
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

router.delete('/:id',passport.authenticate('bearer', { session: false }), isAdmin,  async function (req, res) {
    const db = await connectToDB();
    try {
        let result = await db.collection("volunteer").deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: "Volunteer deleted" });
        } else {
            res.status(404).json({ message: "Volunteer not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


router.get('/:id', passport.authenticate('bearer', { session: false }),async function (req, res) {
    const db = await connectToDB();
    try {
         let page = parseInt(req.query.page) || 1;
        let perPage = parseInt(req.query.perPage) || 6;
        let skip = (page - 1) * perPage;
        let result = await db.collection("volunteer").findOne({ _id: new ObjectId(req.params.id) });
        let result2= await db.collection("event").find( { list: { $in:[new ObjectId(req.params.id)] } }).skip(skip).limit(perPage).toArray();

        if (result) {
           res.json({result,result2,page,perPage});
            //res.json({ result: result, total: total, page: page, perPage: perPage , result2:result2});// instead of using render and it just now return data

        } else {
            res.status(404).json({ message: "Volunteer not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

// router.get('/:id/det', passport.authenticate('bearer', { session: false }),async function (req, res) {
//     const db = await connectToDB();
//   try {
//     let volunteer = await db.collection('volunteer').findOne({ email: req.user.email });
//     let query = { volunteer: { $in: [volunteer._id.toString()] } }
//     if (req.query.title) {
//       query.title = { $regex: req.query.title, $options: "i" };
//     }

//     let page = parseInt(req.query.page) || 1;
//     let perPage = parseInt(req.query.perPage) || 3;
//     let skip = (page - 1) * perPage;

//     let result = await db.collection("event").find(query).skip(skip).limit(perPage).toArray();
//     let total = await db.collection("event").countDocuments(query);

//     res.json({ events: result, total: total, page: page, perPage: perPage });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   } finally {
//     await db.client.close();
//   }
// });

router.get('/stats/organizer', passport.authenticate('bearer', { session: false }),async function (req, res) {
    const db = await connectToDB();
    try {
        console.log("hi)")
      let volunteer = await db.collection('volunteer').findOne({email:req.user.email });
      let result = await db.collection('event').aggregate([
        { $match: {list: { $in:[new ObjectId(req.user._id)] } , organizer: { $ne: null } } },
        { $group: { _id: "$organizer", total: { $sum: 1 } } },
      ])
      .toArray();
      
      console.log(result);
      res.json(result);
  
    } catch (err) {
      res.status(400).json({ message: err.message });
    } finally {
      await db.client.close();
    }
  });

router.put('/:id', passport.authenticate('bearer', { session: false }),isAdmin,async function (req, res) {
    const db = await connectToDB();
    try {
        req.body.terms = req.body.terms ? true : false
        req.body.modifiedAt = new Date();
        delete req.body._id

        let result = await db.collection("volunteer").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Volunteer updated" });
        } else {
            res.status(404).json({ message: "Volunteer not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


router.get('/', passport.authenticate('bearer', { session: false }), isAdmin, async function (req, res) {
    const db = await connectToDB();
    try {
        let query = {};
        if (req.query.email) {
            // query.email = req.query.email;
            query.email = { $regex: req.query.email };
        }
       

        let page = parseInt(req.query.page) || 1;
        let perPage = parseInt(req.query.perPage) || 6;
        let skip = (page - 1) * perPage;

        // sort by sort_by query parameter
        
        let result = await db.collection("volunteer").find(query).skip(skip).limit(perPage).toArray();


        let total = await db.collection("volunteer").countDocuments(query);

        res.json({ volunteer: result, total: total, page: page, perPage: perPage });// instead of using render and it just now return data
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
    finally {
        await db.client.close();
    }
});

// Specify booking being managed by a user
