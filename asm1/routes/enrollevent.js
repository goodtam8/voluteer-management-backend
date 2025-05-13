var express = require('express');
var router = express.Router();
var passport = require('passport');

const { connectToDB, ObjectId } = require('../utils/db');
const { generateToken, isVolunteer, isAdmin } = require('../utils/auth');


module.exports = router;


router.post('/', passport.authenticate('bearer', { session: false }), isAdmin, async function (req, res) {
    const db = await connectToDB();
    try {
        req.body.quota = parseInt(req.body.quota);

        req.body.highlight = req.body.highlight ? true : false
        req.body.list = [];
        req.body.createdAt = new Date();


        req.body.modifiedAt = new Date();

        let result = await db.collection("event").insertOne(req.body);
        res.status(201).json({ id: result.insertedId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


router.delete('/:id', passport.authenticate('bearer', { session: false }), isAdmin, async function (req, res) {
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


router.get('/:id', async function (req, res) {
    console.log("fndls")
    const db = await connectToDB();
   

    try {
        let result = await db.collection("event").findOne({ _id: new ObjectId(req.params.id) });
        let result2 = await db.collection("event").aggregate([
            { $match: { _id: new ObjectId(req.params.id) } },

            {
                $lookup: {
                    from: "volunteer",
                    localField: "list",
                    foreignField: "_id",
                    as: "volunteers"
                }
            }

        ]).toArray();
        // let result2 = []
        if (result) {
            res.json({ result, result2 });
        } else {
            res.status(404).json({ message: "Event not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});

router.put('/:id',passport.authenticate('bearer', { session: false }),isAdmin, async function (req, res) {
    const db = await connectToDB();
    try {
        req.body.quota = parseInt(req.body.quota);
        req.body.highlight = req.body.highlight ? true : false
        req.body.modifiedAt = new Date();
        delete req.body._id

        let result = await db.collection("event").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Event updated" });
        } else {
            res.status(404).json({ message: "Event not found" });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    } finally {
        await db.client.close();
    }
});


router.get('/', async function (req, res) {
    const db = await connectToDB();
    try {
        let query = {};
        if (req.query.title) {
            // query.email = req.query.email;
            query.title = { $regex: req.query.title };
        }
        if (req.query.quota) {
            query.quota = parseInt(req.query.quota);
        }
        if (req.query.highlight === true) {
            query.highlight = true;

        }
        let sort = {};
        if (req.query.sort_by) {

            // split the sort_by into an array
            let sortBy = req.query.sort_by.split(".");

            // check if the first element is a valid field
            if (sortBy.length > 1 && ["modifiedAt"].includes(sortBy[0])) {
                sort[sortBy[0]] = sortBy[1] == "desc" ? -1 : 1;
            }
        }


        let page = parseInt(req.query.page) || 1;
        let perPage = parseInt(req.query.perPage) || 6;
        let skip = (page - 1) * perPage;

        // sort by sort_by query parameter

        let result = await db.collection("event").find(query).sort(sort).skip(skip).limit(perPage).toArray();
        if (result.length > 0) {
            result[0].active = "active"
        }

        let total = await db.collection("event").countDocuments(query);

        res.json({ event: result, total: total, page: page, perPage: perPage });// instead of using render and it just now return data
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
    finally {
        await db.client.close();
    }
});


router.patch('/:id/manage', passport.authenticate('bearer', { session: false }),isAdmin, async function (req, res) {
    const db = await connectToDB();
    try {
        let result = await db.collection("event").findOne({ _id: new ObjectId(req.params.id) });

        if (result.quota > (result.list || []).length) {
            let abc = await db.collection("event").updateOne({ _id: new ObjectId(req.params.id) },
                {
                    $addToSet: { list: new ObjectId(req.user._id) }
                });
        }

        else {
            console.log(result.quota)
            console.log((result.list || []).length)

            res.status(404).json({ message: "Event not found" });
        }


    } catch (err) {
        res.status(400).json({ message: err.message });
    }
    finally {
        await db.client.close();
    }
});


router.patch('/:id/:volunteer/remove', passport.authenticate('bearer', { session: false }), isAdmin, async function (req, res) {
    const db = await connectToDB();
    try {
        let result = await db.collection("event").findOne({ _id: new ObjectId(req.params.id) });

    
            let abc = await db.collection("event").updateOne({ _id: new ObjectId(req.params.id) },
                {
                    $pull: { list: new ObjectId(req.params.volunteer) }
                });
        


    } catch (err) {
        res.status(400).json({ message: err.message });
    }
    finally {
        await db.client.close();
    }
});