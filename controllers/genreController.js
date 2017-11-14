var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var _ = require('lodash');
//var mongoose = require('mongoose');

// Display list of all Genre
exports.genre_list = function(req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function(err, genrelist) {
    		if(err) {
    			return next(err);
    		}
    		//success
            genrelist = _.uniqBy(genrelist, 'name');
            res.render('genre_list', { title: 'Genre List', genre_list: genrelist });
    	});        
};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {
    
    //var id = mongoose.Types.ObjectId(req.params.id.trim());

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        },

    }, function(err, results) {
        if(err) { return next(err); }
        //successful
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre' });
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {
    
    //name field should'nt be empty
    req.checkBody('name', 'Genre name required').notEmpty();     

    //trim and escape the name field
    req.sanitize('name').escape();
    req.sanitize('name').trim();

    //run validators
    var errors = req.validationErrors();

    //create genre object with escaped and trimmed data
    var genre = new Genre( { name: req.body.name });

    if (errors) {
        res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors });
    return;       
    }  
    else {
        Genre.findOne({ 'name': req.body.name })
        .exec(function(err, found_genre) {
            console.log('found_genre:' + found_genre);
            if (err) { return next(err); }

            if (found_genre) {
                res.redirect(found_genre.url);
            }
            else {
                genre.save(function(err) {
                    if (err) { return next(err); }
                    res.redirect('/catalog/genres');
                });
            }
        });
    }
};

// Display Genre delete form on GET
exports.genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
    });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {
    req.checkBody('genreid', 'Genre id mist exist').notEmpty();

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genres_books: function(callback) {
            Book.find({'genre': req.body.genreid} , 'title summary').exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        if(results.genres_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
            return;
        } 
        else {
            //Genre has no books. Delete the object and redirect to genrelist
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if(err) { return next(err); }
                //success
                res.redirect('/catalog/genres');
            })
        }
    });    
};

// Display Genre update form on GET
exports.genre_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    Genre.findById(req.params.id).exec(function(err, genre){
        if(err) { return next(err); }

        res.render('genre_form', {title: 'update Genre', genre: genre});
    });  
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res, next) {
  
    //sanitize id 
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //check data
    req.checkBody('name', 'Genre name required').notEmpty();     

    //sanitize name field
    req.sanitize('name').escape();
    req.sanitize('name').trim();

    var errors = req.validationErrors();

    var genre = new Genre( 
        { name: req.body.name,
        _id: req.params.id // to keep the old id.  
    });

    
    if(errors) {
        res.render('genre_form', {title: 'update Genre', genre: genre, errors: errors });
        return;
    }
    else {
        Genre.findByIdAndUpdate(req.params.id, genre, function(err) {
            if(err) { return next(err); }
            //success
            res.redirect('/catalog/genres');
        });
    }
  
};
