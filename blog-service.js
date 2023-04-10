const Sequelize = require('sequelize');
const Op = Sequelize.Op;    //Operators

//sync function
let initialize  = function(){
   return new Promise((resolve, reject) => {
    // synchronize the Database with our models and automatically add the 
    // table if it does not exist
    sequelize.sync().then(() =>{
        resolve('Sync successful');
    }).catch((err)=>{ reject('unable to sync database: ' + err)});
    
});

//Getter Functions

}

function getAllPosts(){
    return new Promise((resolve, reject) => {
        Post.findAll()
        .then((data) =>{resolve(data);})
        .catch((err)=>{reject('unable to fetch data: ' + err);})
    });
    
}

function getPostsByCategory(category){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {category: category}
        })
        .then((data) => {resolve(data);})
        .catch((err) => {reject('Unable to fetch by category: '+ err);})
    });
    
}

function getPostsByMinDate(minDatestr){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where: {
                postDate: {
                    [Op.gte]: new Date(minDatestr)
                    //gte => greater than or equal to
                }
            }
        }).then((data)=>{resolve(data)})
        .catch((err) =>{reject('unable to fetch data by date: '+ err);});
    });
}    

function getPostById(id){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{id: id}
        })
        .then((data) =>{resolve(data[0])})  // "data[0]" as findAll returns an array
        .catch((err) =>{reject("unable to get data by id: "+ err)});
    });
    
}


function getPublishedPosts(){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{published: true}
        })
        .then((data)=>{resolve(data)})
        .catch((err) =>{reject('Unable to get published posts: ' +err)})
    });
    
}

function getPublishedPostsByCategory(category){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{
                published: true,
                category: category
            }
        })
        .then((data)=>{resolve(data)})
        .catch((err) =>{reject('Unable to get published posts by category: ' +err)})
    });
    
}


function getCategories(){
    return new Promise((resolve, reject) => {
        Category.findAll()
        .then((data)=>{resolve(data)})
        .catch((err)=>{reject('unable to get Categories: '+ err)});
    });
    
}

// Adder Functions

function addPost(postData){
    return new Promise((resolve, reject) => {
        //published property is explicitly set (true or false)
        postData.published = (postData.published) ? true : false;
        //all of the remaining "" are replaced with null
        for(let i in postData){
            if(i == ""){
                i:null; 
            }
        }
        postData.postDate = new Date();
        Post.create({
            body : postData.body,
            title: postData.title,
            postDate: postData.postDate,
            featureImage: postData.featureImage,
            published: postData.published,
            category: postData.category
        })
        .then(()=>{resolve('Post created successfully')})
        .catch((err)=>{reject('Unable to create Post: '+ err)});
    });
}

function addCategory(categoryData){
    return new Promise((resolve,reject) =>{
        console.log(categoryData);
        for(let i in categoryData){
            i == ""? i:null;
        }
        Category.create({
            category: categoryData.category
        })
        .then(() =>{resolve('Category created successfully')})
        .catch((err) =>{reject('Unable to create Category: '+ err)});
    })
}

//delete functions
function deleteCategoryById(id){
    return new Promise((resolve,reject) =>{
        Category.destroy({
            where:{id: id}
        }).then(()=>{resolve('Category destroyed')})
        .catch((err) =>{reject('unable to delete category: ' + err)})

    })
}

function deletePostById(id){
    return new Promise((resolve,reject) =>{
        Post.destroy({
            where:{id: id}
        }).then(()=>{resolve('Post destroyed')})
        .catch((err) =>{reject('unable to delete post: ' + err)})

    })
}


//Database Management

//setting up sequelize
var sequelize = new Sequelize('rjjxprif', 'rjjxprif', 'dbBDsidQOUC4JQdR5_9fuNl8F13R8KLU', {
    host: 'hansken.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

//authenticating connection
sequelize.authenticate()
    .then(() =>{console.log("succesfully connected to database");})
    .catch((err)=>{console.log("Unable to connect to database: ",err);});

//defining POST
var Post = sequelize.define('Post',{
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
})

//defining CATEGORY
var Category = sequelize.define('Category',{
    category: Sequelize.STRING
})

//setting up a relation between post and category
Post.belongsTo(Category,{foreignKey: 'category'}); 

module.exports = {
    initialize:initialize,
    getAllPosts :getAllPosts,
    getPublishedPosts : getPublishedPosts,
    getCategories : getCategories,
    addPost : addPost,
    getPostsByCategory: getPostsByCategory,
    getPostById:getPostById,
    getPostsByMinDate:getPostsByMinDate,
    getPublishedPostsByCategory:getPublishedPostsByCategory,
    addCategory : addCategory,
    deleteCategoryById: deleteCategoryById,
    deletePostById: deletePostById
    
   

}
    

