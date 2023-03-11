var posts = [];
var categories = [];
const { rejects } = require("assert");
const fs = require("fs");
const { resolve } = require("path");




var readpost =  new Promise((resolve,reject) =>{
    fs.readFile("./data/posts.json",'UTF-8',(err,data) =>{
        if(err){
            reject("unable to read posts.json");
        }
        parsed_data = JSON.parse(data);
        
        for (let i in parsed_data){
            posts[i] = parsed_data[i];
            
        }
         
        resolve("posts.json read successfully");
    
        
    })
})

const readcategories = readpost.then(()=>{
    return new Promise((resolve,reject) =>{
        fs.readFile('./data/categories.json','UTF-8',(err,data) =>{
            if (err){
                reject("unable to read categories.json");
            }    
            else{
                parsed_data = JSON.parse(data);
                for (let i in parsed_data){
                    categories[i] = parsed_data[i];
                }
                resolve("categories.json read successfully");
            }
        })
        
    }).catch(err => console.log(err));
}).catch(err => console.log(err));



let initialize  = function(){
    return new Promise((resolve,reject) =>{
        Promise.all([readpost,readcategories]).then((message) =>{

         resolve(message);
        }).catch(err => {
            reject(err);
  
        })

    })

}

function getAllPosts(){
    return new Promise((resolve,reject) =>{
        if (posts.length != 0){
            resolve(posts);
        }
        else{
            reject("Posts empty");
        }
    })
}

function getPublishedPosts(){
    let published_posts = [];
    var j=0;
    return new Promise((resolve,reject) =>{
        for (let i in posts){
            if (posts[i]["published"] == true){
                published_posts[j] = posts[i];
                j++;
            }
        }
        if (published_posts.length > 0){
            resolve(published_posts);
        }
        else{
            reject("No Published data found");
        }
    })
}

function getCategories(){
    return new Promise((resolve,reject) =>{
        if (categories.length > 0){
            resolve(categories);
        }
        else{
            reject("Unable to get Categories");
        }
    })
}
function CurrentDate(){
    let date = new Date;
   return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`; 
    }

function addPost(postData){
    return new Promise((resolve,reject) =>{
        if (postData.published){
            postData.published = true;
        }
        else{
            postData.published = false;
        }
        postData.I = posts.length + 1;
        postData.postDate = CurrentDate();
        
        posts.push(postData);
        resolve(postData);
    })
}

function getPostsByCategory(category){
    return new Promise((resolve,reject) =>{
        let p = [];
        for(let i in posts){
            if (posts[i].category == category){
                p.push(posts[i]);
            }
        }
        if (p.length > 0){
            resolve(p);
        }
        else{
            reject("no results returned");
        }
    })
    
}

function getPostsByMinDate(minDatestr){
    return new Promise((resolve,reject) =>{
        let p = [];
        for (let i in posts){
            if (new Date(posts[i].postDate) >= new Date(minDatestr)){
                p.push(posts[i]);
            }
        }
        if (p.length > 0){
            resolve(p);
        }
        else{
            reject("no data returned");
        }
    })
}

function getPostById(id){
    return new Promise((resolve,reject) =>{
        let p = [];
        for (let i in posts){
            if (posts[i]["I"] == id){
                resolve(posts[i])
            }
        }
                
        reject('no data returned');
        
        
    })
}

function getPublishedPostsByCategory(category){
    return new Promise((resolve,reject) =>{
        let p = [];
        for(let i in posts){
            if (posts[i].category == category && posts[i]['published'] == true){
                p.push(posts[i]);
            }
        }
        if (p.length > 0){
            resolve(p);
        }
        else{
            reject("no results returned");
        }
    })
}


module.exports = {
    initialize:initialize,
    getAllPosts :getAllPosts,
    getPublishedPosts : getPublishedPosts,
    getCategories : getCategories,
    addPost : addPost,
    getPostsByCategory: getPostsByCategory,
    getPostById:getPostById,
    getPostsByMinDate:getPostsByMinDate,
    getPublishedPostsByCategory:getPublishedPostsByCategory

}
    

