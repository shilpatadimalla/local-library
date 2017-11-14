var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var _ = require('lodash');

var async = require('async');

exports.index = function(req, res) {
    
    async.parallel({
    	book_count: function(callback) {
    		Book.count(callback);
    	}, 
    	book_instance_count: function(callback) {
    		BookInstance.count(callback);
    	},
    	book_instance_available_count: function(callback) {
    		BookInstance.count({status: 'Available'}, callback);
    	},
    	author_count: function(callback) {
    		Author.count(callback);
    	}, 
    	genre_count: function(callback) {
    		Genre.count(callback);
    	}
    }, function(err, results) {
    	res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books
exports.book_list = function(req, res) {
    Book.find({}, 'title author')
    .populate('author')
    .exec(function(err, bookslist) {
        if(err) {
            return next(err);
        }
        res.render('book_list', {title: 'Book List', book_list: bookslist});
    })
    
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {

  async.parallel({
    book: function(callback) {     
        
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instance: function(callback) {

      BookInstance.find({ 'book': req.params.id })
        //.populate('book')
        .exec(callback);
    },
  }, function(err, results) {
    if (err) { return next(err); }
    //Successful, so render
    res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance });
  });
    
};

// Display book create form on GET
exports.book_create_get = function(req, res, next) {
    
    //get all authors and genres 
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if(err) { return next(err); }
        results.authors = _.uniqBy(results.authors, 'family_name');
        results.genres = _.uniqBy(results.genres, 'name');
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});
    });   
};

// Handle book create on POST
exports.book_create_post = function(req, res) {
    req.checkBody('title', 'Title must not be empty').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();
    
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();     
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();
    
    var book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre.split(',')
    });    

console.log('BOOK:' + book);

var errors = req.validationErrors();
    if (errors) {
        // Some problems so we need to re-render our book

        //Get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);

            },

        }, function(err, results) {
            if (err) { return next(err); }
                       
            // Mark our selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    //Current genre is selected. Set "checked" flag.
                    results.genres[i].checked = 'true';

                }
            }
            results.authors = _.uniqBy(results.authors, 'family_name');
            results.genres = _.uniqBy(results.genres, 'name');
            res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors });
        });

    } 
    else {
    // Data from form is valid.
    // We could check if book exists already, but lets just save.
    
        book.save(function (err) {
            if (err) { return next(err); }
            //successful - redirect to new book record.
            res.redirect(book.url);
        });
    }

};
// Display book delete form on GET
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.params.id}).exec(callback)
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        res.render('book_delete', { title:' Delete Book', book: results.book, book_instances: results.book_instances});
    });
};

// Handle book delete on POST
exports.book_delete_post = function(req, res, next) {
    /*assume the post will have id to delete(ie no checking or sanitization.)
    req.checkBody('bookid', 'Book id must exist').notEmpty();  */

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        book_bookinstances: function(callback) {
            BookInstance.find({ 'book': req.params.id}, 'title summary').exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        if(results.book_bookinstances.length > 0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_instances});
            return;
        }
        else {
            //book has no book instances. Delete object and redirect to booklist
            Book.findByIdAndRemove(req.body.id, function deleteBook(err) {
                if(err) { return next(err); }
                //success
                res.redirect('/catalog/books');
            });
        }
    }); 
};

// Display book update form on GET
exports.book_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //get book, authors and genres from form
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //mark selected genres as checked
        for(var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for(var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if(results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        results.authors = _.uniqBy(results.authors, 'family_name');
        results.genres = _.uniqBy(results.genres, 'name');
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
    });
};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {
        //Sanitize id passed in. 
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    
    //Check other data
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();
    
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();
    req.sanitize('author').trim(); 
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();
    
    var book = new Book(
      { title: req.body.title, 
        author: req.body.author, 
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre.split(","),
        _id:req.params.id //This is required, or a new ID will be assigned!
       });
    
    var errors = req.validationErrors();
    if (errors) {
        // Re-render book with error information
        // Get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }
            
            // Mark our selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    results.genres[i].checked='true';
                }
            }
            res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors });
        });

    } 
    else {
        // Data from form is valid. Update the record.
        Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
            if (err) { return next(err); }
            //successful - redirect to book detail page.
            res.redirect(thebook.url);
        });
    }

};