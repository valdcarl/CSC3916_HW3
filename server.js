/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

let envPath = __dirname + "/.env"
require('dotenv').config({path:envPath});
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}
// signup
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});
// signin
router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
router.route('/movies')

    //Get the movies
    .get(function (req, res) {
            Movie.find({}, function (err,movies) {
                if (err) throw err;
                else
                    console.log(movies);
                    res = res.status(200);
                    res.json({success: true, msg: 'GET movies.'});
            });
        }
    )

    //Save movies
    .post( authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.title || !req.body.genre || !req.body.releaseYear || !req.body.actors) {
            res.json({success: false, msg: 'Please pass in all 4 required criteria in order to save a movie!'});
        }
        else {
            if(req.body.actors.length < 3) {
                res.json({ success: false, message: 'Please include at least three actors.'});
            }
            else {
                var movie = new Movie();
                movie.title = req.body.title;
                movie.releaseYear = req.body.releaseYear;
                movie.genre = req.body.genre;
                movie.actors = req.body.actors;

                movie.save(function(err, movies) {
                    if (err) {
                        if (err.code == 11000)
                            return res.json({ success: false, message: 'A movie with that title already exists.'});
                        else
                            return res.send(err);
                    }
                    res.json({ message: 'Movie has been successfully created.' });
                });
            }
        }
    })

    //Update movies
   .put(authJwtController.isAuthenticated, function(req, res) {
       if (!req.body.title) {
           res.json({success: false, msg: 'Please pass a Movie Title to update.'});
       } else {
           Movie.findOne({title: req.body.title}, function (err, movies) {
               if (err) throw err;
               else {
                   //var movie = new Movie();
                   movies.title = req.body.title;
                   movies.releaseYear = req.body.releaseYear;
                   movies.genre = req.body.genre;
                   movies.actors = req.body.actors;
                   movies.imageURL = req.body.imageURL;

                   movies.save(function (err) {
                       if (err) throw err;

                       res.json({success: true, msg: 'Movie has been successfully updated.'});
                   })
               }
           })
       }
   })

    //delete a movie
    .delete(authJwtController.isAuthenticated, function(req, res) {
        if (!req.body.title) {
            res.json({success: false, msg: 'Please input the an existing movie title to delete.'});
        }
        else {
            Movie.findOneAndRemove({title: req.body.title}, function (err) {
                if (err) throw err;
                res.json({success: true, msg: 'Movie has been successfully deleted.'});
            })
                //}
            //})
        }
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only

