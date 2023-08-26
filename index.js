import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


// db connection
mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "api"
}).then(
    () => { console.log("db connected") }
).catch(
    (e) => { console.log(e) }
)

//  structure of table/object
const userSchema = new mongoose.Schema(  // new coz we are creating a new structure
    {
        name: String,
        email: String,
        password: String
    }
)
// table/object
const usersTable = mongoose.model("users", userSchema)



const app = express();

// req middlewares
app.set("view engine", "ejs"); // for ejs
app.use(express.urlencoded({ extended: true })); // to get data from form in body object
app.use(cookieParser()) // to get req.cookies



app.get("/", (req, res) => {   // starting run api


    // fetching payload value from saved token in cookie
    const { token } = req.cookies;
    if (token) {
        let decodedToken = jwt.verify(token, "00001234shivraj")
        res.render("logout", { name: decodedToken.name });
    }


    else {
        res.render("register");
    }
})



app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password,10);

    // save data in db
    const User = await usersTable.create(
        {
            name: name,
            email: email,
            password: hashedPassword
        }
    );

    // create token
    const token = jwt.sign({ "_id": User._id, "name": User.name }, "00001234shivraj");


    // save in cookie
    res.cookie("token", token, {
        expires: new Date(Date.now() + (60 * 60 * 1000)),
    });


    res.render("logout", { name: name });

})

app.get("/logout", async (req, res) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),

    });

    res.redirect("/login");

})


app.get("/login", (req, res) => {
    res.render("login")
})




app.post("/login", async (req, res) => {

    const { email, password } = req.body;
    let user = await usersTable.findOne({ email });

    if (user) {

        // === compare dont work , no need to hash the body password
        const isMatch = await bcrypt.compare(password , user.password)

        
        if (isMatch) {

            // create token
            const token = jwt.sign({ "_id": email, "name": user.name }, "00001234shivraj");
            // save in cookie
            res.cookie("token", token, {
                expires: new Date(Date.now() + (60 * 60 * 1000)),
            });


            res.render("logout", { name: user.name })
        }
        else {
            res.render("login", { message: "password incorrect", email: email })
        }
    }
    else {

        res.render("login", { msg: "no user found!!!" })

    }

})




app.listen(5000, () => {
    console.log("server started");
    
});