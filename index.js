const express = require("express")
const mongoose = require('mongoose')
const Listing = require('./model/listing')
const path = require("path")
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const wrapAsync = require('./utils/wrapAsync.js')
const ExpressError = require('./utils/ExpressError.js')
const {listingSchema} = require('./schema.js')

const app = express();
const PORT = 8080;
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust"

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
app.engine('ejs',ejsMate);


const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body)
    if(error)
    {
        let errMsg = error.details.map((el)=> el.message).join(",")
        throw new ExpressError(400, errMsg)
    }
    else {
        next()
    }
}


main().then(()=> {
    console.log("connected to DB")
})
.catch((err)=>{
    console.log(err)
})


async function main() {
    await mongoose.connect(MONGO_URL)
}



app.get("/",(req,res)=>{
    res.send("I'm root")
})

//index route
app.get("/listings", wrapAsync( async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}))

app.post("/listings", validateListing, wrapAsync ( async (req,res,next)=>{
        // if(!req.body.listing) {
        //     throw new ExpressError(400,"Send Valid Data for Listing.")
        // }
        const listing = req.body.listing;
        const newListing = new Listing(listing);
        await newListing.save()
        res.redirect('/listings')
}))

//Edit 
app.get("/listings/:id/edit",wrapAsync( async(req,res)=>{
    let {id} =  req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing})
}))

//Update
app.put("/listings/:id", validateListing, wrapAsync( async(req,res)=> {
    // if(!req.body.listing) {
    //     throw new ExpressError(400,"Send Valid Data for Listing.")
    // }
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing})
    res.redirect(`/listings/${id}`)
}))

//delete
app.delete("/listings/:id", wrapAsync(async(req,res)=> {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing)
    res.redirect(`/listings`)
}))

//New route
app.get("/listings/new", (req,res)=>{
    res.render("listings/new.ejs");
})



//show route
app.get("/listings/:id",wrapAsync(async (req,res)=>{
    let {id} =  req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}))


app.all("*",(req, res, next)=>{
    next( new ExpressError(404,"Page Not Found!"));
})

app.use((err,req,res,next)=> {
    let {statusCode=500, message="Something went wrong"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
});

app.listen(PORT,()=>{
    console.log("server is listening on port 8080");
});

// app.get("/testlisting", async(req,res)=>{
//     let sampleListing = new Listing({
//         title:"My name is Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute Goa",
//         country: "India"
//     })

//     await sampleListing.save();
//     console.log("Sample data was saved")
//     res.send("Successful testing")
// })

