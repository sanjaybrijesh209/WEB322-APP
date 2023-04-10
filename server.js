/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ____Sanjay Brijesh___ Student ID: ___156653214___________ Date: ____2023-04-09____________
*
*  Online (Cyclic) Link: ________https://tired-undershirt-elk.cyclic.app________________________________________________
*
********************************************************************************/ 
 
const express  = require("express");
const app = express();
const path = require("path");
var blog = require("./blog-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
var authData = require('./auth-service');
const clientSessions = require('client-sessions');
const { Server } = require("http");

var HTTP_PORT = process.env.port || 8080;

cloudinary.config({
    cloud_name: 'dzpvk2njl',
    api_key: '511859718348939',
    api_secret:"wynXdN-Vbb5ogkBD2i_zMTvtDrE",
    secure:true
});

const upload =multer();

app.use(express.static("public")); // including static file(css,images etc..)

app.engine('.hbs',exphbs.engine({
    extname: '.hbs',
    defaultLayout: "main",
    //layoutsDir: path.join(__dirname + '/views/layouts')// for changing dir of main
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';

        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(context){
            return stripJs(context);
        },
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }

        
    }
}));
app.set('view engine','.hbs');

app.use(express.urlencoded({extended: true}));


app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "application_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// This is a helper middleware function that checks if a user is logged in
// we can use it in any route that we want to protect against unauthenticated access.
// A more advanced version of this would include checks for authorization as well after
// checking if the user is authenticated
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


app.get("/",(req,res) =>{
    res.redirect("/blog"); // root redirected to about page (landing page)
    
});


app.get("/about",(req,res) =>{
   
    res.render('about');
});


app.get("/posts/add",ensureLogin,(req,res) =>{
    blog.getCategories()
        .then((data)=>{
            res.render("addPost",{categories:data});
            
        })
        .catch(()=>{res.render("addPost",{categories:[]})})
    
})




app.get('/posts',ensureLogin,(req,res) =>{ 
    
    blog.getAllPosts()  
    .then((data) =>{
        if(req.query.category){
            
            
            get = async() =>{
                
                let posts = await blog.getPostsByCategory(req.query.category);
                if (posts.length > 0){
                    res.render("posts",{data: posts});
                    console.log(posts);
                }
                else{res.render("posts",{message: "No Results"});}
            }
                get().catch(err => res.render("posts",{message : "request invalid"}));
                
            }
            else if(req.query.minDate){
                console.log(req.query.minDate);
                get = async() =>{
                    
                    let posts = await blog.getPostsByMinDate(req.query.minDate);
                    if (posts.length > 0){
                        res.render("posts",{data: posts});
                        console.log(posts);
                    }
                    else{res.render("posts",{message: "No Results"});}
                    
                }
                get().catch((err) => res.render("posts",{
                    message: "data not found"
                }))
            }
            else{
                console.log(data); 
                if (data.length > 0){
                    res.render("posts",{data: data});
                }
                else{res.render("posts",{message: "No Results"});}
            }
        })
        .catch((err) =>console.log(err));
        
    })
    
    
    app.get('/posts/:value',ensureLogin,(req,res)=>{
        
        if(req.params["value"]){
            
            get = async() =>{
                let p = await blog.getPostById(req.params["value"]);
                console.log(p);
                res.render("posts",
                {
                    data: p
                });
            }
            get().catch(err => res.render("posts",{message: "Data Not Found"}));
        }
    })
    
    
    app.post("/posts/add",ensureLogin,upload.single("featureImage"),(req,res) =>{
        
        if(req.file){
            
            let streamUpload = (req) => {
                    return new Promise((resolve, reject) => {
                        let stream = cloudinary.uploader.upload_stream(
                            (error, result) => {
                                if (result) {
                                    resolve(result);
                                } else {
                                    reject(error);
                                }
                            }
                            );
                            
                            streamifier.createReadStream(req.file.buffer).pipe(stream);
                            
                            
                        });
                    };
                    
                    async function upload(req) {
                        let result = await streamUpload(req);
                        console.log(result);
                        return result;
                    }
                    
                    upload(req).then((uploaded)=>{
                        console.log(uploaded);
                        
                        req.body.featureImage = uploaded.url;  
                        
                        blog.addPost(req.body); 
                        res.redirect('/posts');
                    });
                }
                else{
                    
                    req.body.featureImage = null;  
                    
                    blog.addPost(req.body);
                    
                    res.redirect('/posts');
                }
                
            })
            
            app.get("/posts/delete/:id",ensureLogin,(req,res) =>{
                if (req.params["id"]){   
                    blog.deletePostById(req.params["id"])
                    .then(res.redirect("/posts"))
                    .catch(res.status(500).send("Unable to Remove Post / Post not found"));
                }
            })
            
            
            
            
            
//  Blog
    
app.get('/blog',(req, res) => { 
    
    blog.getPublishedPosts()
    .then(async(data) =>{
        // to store properties for the view
        let viewData = {};
        
        try{
            
            // declare empty array to hold "post" objects
            let posts = [];
                        
        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }
        
        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        
        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 
        
        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;
        
    }catch(err){
        viewData.message = "no results";
    }
    
    try{
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();
        
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
    
    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
        
        
    })             

})




app.get('/blog/:id', async (req, res) => {
    
    // Declare an object to store properties for the view
    let viewData = {};
    
    try{
        
        // declare empty array to hold "post" objects
        let posts = [];
        
        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            console.log("catgggg=>>>" +req.query.category)
            // Obtain the published "posts" by category
            posts = await blog.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blog.getPublishedPosts();
        }
        
        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
        
        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        
    }catch(err){
        viewData.message = "no results";
    }
    
    try{
        // Obtain the post by "id"
        viewData.post = await blog.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
    
    try{
        // Obtain the full list of "categories"
        let categories = await blog.getCategories();
        
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
    
    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData});
})





//  Category
app.get("/categories",ensureLogin,(req,res) =>{
    blog.getCategories() 
    .then((data) =>{
        if (data.length > 0){
            res.render("categories",{data: data})
            
        }
        else{
            res.render("categories",{message: "No Results"})
        }
        
    }).catch((err) => console.log(err));
    
    
});

app.get("/categories/add",ensureLogin,(req,res) =>{
    res.render("addCategory");
})

app.post("/categories/add",ensureLogin,(req,res) =>{
    
    blog.addCategory(req.body);
    
    res.redirect('/categories');
    
    
});

app.get("/categories/delete/:id",ensureLogin,(req,res) =>{
    if (req.params["id"]){
        
        blog.deleteCategoryById(req.params["id"])
        .then(()=>{res.redirect("/categories")})
        .catch(() =>{res.status(500).send("Unable to Remove Category / Category not found")});
    }
});



blog.initialize()
.then(authData.initialize())
.then(() => {
    
    app.listen(HTTP_PORT,() =>{console.log("app listening on: " + HTTP_PORT)});
})
.catch((err) =>{console.log(err)});  

//assignment-6

app.get('/login',(req,res)=>{
    
    res.render('login');
});

app.get('/register',(req,res)=>{
   
    
    res.render('register');
});

app.post('/register',(req,res)=>{
    
    authData.registerUser(req.body)
    .then(()=>{res.render("register",{successMessage: "User created"})})
    .catch((err)=>{ res.render("register",{errorMessage: err,userName: req.body.userName});
})
})

app.post('/login',(req,res)=>{
    req.body.userAgent = req.get('User-Agent');
    
    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName, // authenticated user's userName
            email: user.email,// authenticated user's email
            loginHistory: user.loginHistory// authenticated user's loginHistory
        }
        
        res.redirect('/posts');
    })
    .catch((err)=>{res.render('login',{errorMessage: err, userName: req.body.userName})})
    
});

app.get('/logout',(req,res)=>{
    req.session.reset();
    res.redirect("/login");
});

app.get("/userHistory",ensureLogin,(req,res)=>{
    
    res.render("userHistory",{session:req.session });
    
});


app.use((req, res) => {
    res.status(404).render("404");
});