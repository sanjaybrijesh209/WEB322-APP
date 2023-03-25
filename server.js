/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ____Sanjay Brijesh___ Student ID: ___156653214___________ Date: ____2023-03-24____________
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

const { Server } = require("http");

var HTTP_PORT = process.env.port || 8080;

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


app.get("/",(req,res) =>{
    res.redirect("/blog"); // root redirected to about page (landing page)
    
});


app.get("/about",(req,res) =>{
    res.render('about');
});


app.get("/posts/add",(req,res) =>{
    blog.getCategories()
        .then((data)=>{
            res.render("addPost",{categories:data});
            
        })
        .catch(()=>{res.render("addPost",{categories:[]})})
    
})

app.get("/categories/add",(req,res) =>{
    res.render("addCategory");
})



cloudinary.config({
    cloud_name: 'dzpvk2njl',
    api_key: '511859718348939',
    api_secret:"wynXdN-Vbb5ogkBD2i_zMTvtDrE",
    secure:true
});

const upload =multer();




blog.initialize()
.then((message) => {
    console.log(message); // ['posts.json read successfully','categories.json read successfully'] if successful
    app.listen(HTTP_PORT);
    
    
    blog.getAllPosts()  
    .then((data) =>{
        
        //  posts
        
        
        app.get('/posts',(req,res) =>{      // /posts
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
        
        app.get('/posts/:value',(req,res)=>{
            
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
        
        
        app.post("/posts/add",upload.single("featureImage"),(req,res) =>{
            
                if(req.file){
                    console.log("REQ FILE EXISTSTSSSSSSSSS")
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

        app.get("/posts/delete/:id",(req,res) =>{
            if (req.params["id"]){   
                blog.deletePostById(req.params["id"])
                    .then(res.redirect("/posts"))
                    .catch(res.status(500).send("Unable to Remove Post / Post not found"));
            }
        })
        
        //  Blog
        blog.getPublishedPosts() 
        .then((data) => {
            app.get('/blog', async (req, res) => {  

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

            });
            
            app.get('/blog/:id', async (req, res) => {

                // Declare an object to store properties for the view
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
                
            });

            //  Category

            blog.getCategories() 
            .then((data) =>{
                    app.get("/categories",(req,res) =>{
                        if (data.length > 0){
                            res.render("categories",{data: data})

                        }
                        else{
                            res.render("categories",{message: "No Results"})
                        }
                    
                    
                    });
                   
                    app.post("/categories/add",(req,res) =>{
                        
                        blog.addCategory(req.body);
                        
                        res.redirect('/categories');
    
                         
                    });

                    app.get("/categories/delete/:id",(req,res) =>{
                        if (req.params["id"]){
                            
                            blog.deleteCategoryById(req.params["id"])
                                .then(()=>{res.redirect("/categories")})
                                .catch(() =>{res.status(500).send("Unable to Remove Category / Category not found")});
                        }
                    });
                        
                    app.use((req, res) => {
                        res.status(404).render("404");
                    });
                }).catch((err) => console.log(err));
                
                
            })
            .catch(err => console.log(err));
            
            
            
        }).catch((err) => console.log(err));
        
    
        
    })
    .catch((err) =>console.log(err));
    







