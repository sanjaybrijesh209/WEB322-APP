/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ____Sanjay Brijesh___ Student ID: ___156653214___________ Date: ____2023-02-19____________
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
        }


        
    }
}));
app.set('view engine','.hbs');


app.use(express.static("public")); // including static file(css,images etc..)

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
    res.render("addPost");
})




cloudinary.config({
    cloud_name: 'dzpvk2njl',
    api_key: '511859718348939',
    api_secret:"wynXdN-Vbb5ogkBD2i_zMTvtDrE",
    secure:true
});

const upload =multer();

app.post("/posts/add",upload.single("featureImage"),(req,res) =>{
    
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
        //console.log(uploaded);
        req.body.featureImage = uploaded.url;

        blog.addPost(req.body);
        
        res.redirect('/posts');
        
    });
    

})


blog.initialize()
.then((message) => {
    console.log(message); // ['posts.json read successfully','categories.json read successfully'] if successful
    app.listen(HTTP_PORT);
   
    
    blog.getAllPosts()  //posts
    .then((data) =>{
        app.get('/posts',(req,res) =>{      // /posts
            if(req.query.category){
                
                var p = [];
                get = async() =>{
                    
                    const p = await blog.getPostsByCategory(req.query.category);
                    res.render("posts",
                    {data: p});
                    console.log(p);
                }
                get().catch(err => res.render("posts",{message : "request invalid"}));
                
            }
            else if(req.query.minDate){
                console.log(req.query.minDate);
                get = async() =>{

                    let p = await blog.getPostsByMinDate(req.query.minDate);
                    console.log(p);
                    res.render("posts",
                    {
                        data: p
                    });

                }
                get().catch((err) => res.render("posts",{
                    message: "data not found"
                }))
            }
            else{
                console.log(data); 
                res.render("posts",{
                    data: data
                });
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
        
        blog.getPublishedPosts() 
        .then((data) => {
            app.get('/blog', async (req, res) => {  //blog

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

            

            blog.getCategories() //categories
            .then((data) =>{
                    app.get("/categories",(req,res) =>{
                        res.render("categories",{
                            data: data
                        })
                        
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
    








