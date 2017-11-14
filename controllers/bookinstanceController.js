var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var moment = require('moment');
var async = require('async');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res) {
    BookInstance.find()
    .populate('book')
    .exec(function(err, bookinstanceslist) {
    	if(err) { return next(err); }
    	//successful, 
    	res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: bookinstanceslist});
    });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if(err) { return next(err); }
            //success
            res.render('bookinstance_detail', {title: 'BookInstance', bookinstance: bookinstance});
        });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title') 
        .exec(function(err, books) {
            if(err) { return next(err); }
            //success
            res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
        });   
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res) {
    req.checkBody('book', 'Book must be specified').notEmpty();
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    moment('due_back', 'Invalid date').isValid();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
    });

    var errors = req.validationErrors();
    if(errors) {
        Book.find({}, 'title')
        .exec(function(err, books) {
            if(err) {return next(err); }
            //success
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book_id, errors: errors, bookinstance: bookinstance});
        });
        return;
    }
    else {
        // if data is valid
        bookinstance.save(function(err) {
            if(err) { return next(err); }
            //success - redirect to new book instance record.
            res.redirect(bookinstance.url);
        });
    }
};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {
    /*async.parallel({
        bookinstance: function(callback){
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        res.render('bookinstance_delete', { title: 'Delete this instance(copy)', bookinstance: results.bookinstance});
    });*/
     BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance){
            if(err) { return next(err); }
            //success
            res.render('bookinstance_delete', {title: 'Delete this book instance(copy)', bookinstance: bookinstance });        
        });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {
    //req.checkBody(id, 'BookInstance id must exist').notEmpty();

    /*async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        //success
        //res.render('bookinstance_delete', {title: 'Delete Bookinstance', bookinstance: results.bookinstance });
        //return;*/
        BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err) {
            if(err) { return next(err); }
            //success
            res.redirect('/catalog/bookinstances');
        });
        
    //});
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback)
        },
        books: function(callback) {
            Book.find(callback)
        }
    },function(err, results) {
        if(err) { return next(err); }
        //success
        res.render('bookinstance_form', {title: 'Update Bookinstance', bookinstance: results.bookinstance, book_list: results.books });
    });    

};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    req.checkBody('book', 'Book must be specified').notEmpty();
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    moment('due_back', 'Invalid date').isValid();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id // to keep old id and update the record
    });

    var errors = req.validationErrors();
    if(errors) {
        Book.find({}, 'title')
        .exec(function(err, books) {
            if(err) {return next(err); }
            //success
            res.render('bookinstance_form', { title: 'UPdate BookInstance', book_list: books, selected_book: bookinstance.book_id, errors: errors, bookinstance: bookinstance});
        });
        return;
    }
    else {
        BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err) {
            if(err) { return next(err); }
            //success
            res.redirect('/catalog/bookinstances');
        });
    }       
};