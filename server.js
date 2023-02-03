/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: _____Sanjay Brijesh___________ Student ID: ___156653214___________ Date: _____2023-02-03___________
*
*  Online (Cyclic) Link: ___________https://tired-undershirt-elk.cyclic.app_____________________________________________
*
********************************************************************************/ 


const express  = require("express");
const app = express();
const path = require("path");
var blog = require("./blog-service");

const { Server } = require("http");

var HTTP_PORT = process.env.port || 8080;




app.use(express.static("public")); // including static file(css,images etc..)

app.get("/",(req,res) =>{
    res.redirect("/about"); // root redirected to about page (landing page)

});

app.get("/about",(req,res) =>{
    res.sendFile(path.join(__dirname,"/views/about.html"));
});





blog.initialize()
.then((message) => {
    console.log(message); // ['posts.json read successfully','categories.json read successfully'] if successful
    app.listen(HTTP_PORT);
    
    
    blog.getAllPosts()  //posts
    .then((data) =>{
        app.get('/posts',(req,res) =>{
            res.send(data);
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







