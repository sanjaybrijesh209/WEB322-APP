/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: ____Sanjay Brijesh___ Student ID: ___156653214___________ Date: ____2023-02-19____________
*
*  Online (Cyclic) Link: ________________________________________________________
*
********************************************************************************/ 
 


const express  = require("express");
const app = express();
const path = require("path");
var blog = require("./blog-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const { Server } = require("http");

var HTTP_PORT = process.env.port || 8080;




app.use(express.static("public")); // including static file(css,images etc..)

app.get("/",(req,res) =>{
    res.redirect("/about"); // root redirected to about page (landing page)

});

app.get("/about",(req,res) =>{
    res.sendFile(path.join(__dirname,"/views/about.html"));
});

app.get("/posts/add",(req,res) =>{
    res.sendFile(path.join(__dirname + "/views/addPost.html"));
})

app.get('/posts/:value',(req,res)=>{
                
                if(req.params["value"]){
                    
                    get = async() =>{
                        let p = await blog.getPostById(req.params["value"]);
                        console.log(p);
                        res.send(p);
                    }
                    get();
                }
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
        app.get('/posts',(req,res) =>{
            if(req.query.category){
                
                var p = [];
                get = async() =>{
                    
                    console.log("catg",req.query.category);
                    const p = await blog.getPostsByCategory(req.query.category);
                    res.send(p);
                    console.log(p);
                }
                get();
                
            }
            else if(req.query.minDate){
                console.log(req.query.minDate);
                get = async() =>{

                    let p = await blog.getPostsByMinDate(req.query.minDate);
                    console.log(p);
                    res.send(p);

                }
                get().catch((err) => console.log("Error: " + err));
            }
            else{
                console.log(data); 
                res.send(data);
            }
            
        app.get('/posts/:value',(req,res)=>{
            
            if(req.params["value"]){
                
                get = async() =>{
                    let p = await blog.getPostById(req.params["value"]);
                    console.log(p);
                    res.send(p);
                }
                get();
            }
        }) 
            
        })
        blog.getPublishedPosts() //blog
        .then((data) => {
            app.get("/blog",(req,res) =>{
                res.send(data);
            })

            blog.getCategories() //categories
            .then((data) =>{
                    app.get("/categories",(req,res) =>{
                    res.send(data);
                    app.use('*',(req,res) =>{ 
                        res.status(404).sendFile(path.join(__dirname,"/views/404.html")); // handle 404
                    });
                })
            }).catch((err) => console.log(err));
        })
        .catch(err => console.log(err));
        
    }).catch((err) => console.log(err));
    
    
})
.catch((err) =>console.log(err));







