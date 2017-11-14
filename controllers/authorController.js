
var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');
var _ = require('lodash');
var moment = require('moment');

//display all Authors list
exports.author_list = function(req, res,next) {
	Author.find()
		.sort([['family_name', 'ascending']])
		.exec(function(err, authorslist) {
			if(err) { return next(err); }
			//successful
			authorslist = _.uniqBy(authorslist, 'family_name'); 
			res.render('author_list', { title: 'Author List', author_list: authorslist });
		});
};

//display detail page for a specific Author
exports.author_detail = function(req, res) {
	
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id)
			.exec(callback);
		},
		authors_books: function(callback) {
			Book.find({ 'author': req.params.id}, 'title summary')
				.exec(callback);
		},
	}, function(err, results) {
		if(err) { return next(err); }
		//success
		res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
	});
};

//display Author create form on GET
exports.author_create_get = function(req, res, next) {
	res.render('author_form', {title: 'Create Author'});
};

//display Author create on POST
exports.author_create_post = function(req, res, next) {
	req.checkBody('first_name', 'First name must be specified.').notEmpty();
	req.checkBody('family_name', 'Family name must be specified.').notEmpty();
	req.checkBody('family_name', 'Family name must be alphanumeric text.').isAlpha();
	//req.checkBody('date_of_birth', 'Invalid date').optional({checkFalsy: true})).isDate();
	//req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true})).isDate();
	moment('date_of_birth', 'Invalid date').isValid();
	moment('date_of_death', 'Invalid date').isValid();

	req.sanitize('first_name').escape();
	req.sanitize('family_name').escape();
	req.sanitize('first_name').trim();
	req.sanitize('family_name').trim();
	req.sanitize('date_of_birth').toDate();
	req.sanitize('date_of_death').toDate();

	var errors = req.validationErrors();
 
	var author = new Author(
		{ first_name: req.body.first_name,
		  family_name: req.body.family_name,
		  date_of_birth: req.body.date_of_birth,
		  date_of_death: req.body.date_of_death	
		});
	if (errors) {
		res.render('author_form', { title: 'Create Author', author: author, errors: errors});
	return;
	}
	else {
		//data from form is valid
		author.save(function(err) {
			if(err) { return next(err); }
			//success
			res.redirect(author.url);
		});
	}
};

//display Author delete form on GET
exports.author_delete_get = function(req, res, next) {
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id).exec(callback);
		}, 
		authors_books: function(callback) {
			Book.find({ 'author': req.params.id}).exec(callback);
		}, 
	}, function(err, results) {
			if(err) { return next(err); }
			//success
			res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books});
		
	});
};

//handle Author delete on POST
exports.author_delete_post = function(req, res, next) {
	req.checkBody('authorid', 'Author id must exist').notEmpty();

	async.parallel({
		author: function(callback) {
			Author.findById(req.body.authorid)
				.exec(callback);
		},
		authors_books: function(callback) {
			Book.find({ 'author': req.body.authorid }, 'title summary').exec(callback); 
		}, 
	}, function(err, results) {
		if(err) { return next(err); }
		//success- author has books, so render 
		if(results.authors_books.length > 0) {
			res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.author_books} );
			return;
		}
		else {
			//author has no books. delete object and redirect to authors list.
			Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
				if(err) { return next(err); }
				//success- go to author list
				res.redirect('/catalog/authors');
			});
		}
	});
};

//display Author update form on GET
exports.author_update_get = function(req, res, next) {	

	req.sanitize('id').escape();
	req.sanitize('id').trim();

	//get author, books, genres
	Author.findById(req.params.id, function(err, author) {
		if(err) { return next(err); }
		//success
		res.render('author_form', {title: 'Update Author',  author: author });
	}); 
};

//Handle Author update POST
exports.author_update_post = function(req, res, next) {

	req.sanitize('id').escape();
	req.sanitize('id').trim();

	req.checkBody('first_name', 'First name must be specified.').notEmpty();
	req.checkBody('family_name', 'Family name must be specified.').notEmpty();
	req.checkBody('family_name', 'Family name must be alphanumeric text.').isAlpha();
	moment('date_of_birth', 'Invalid date').isValid();
	moment('date_of_death', 'Invalid date').isValid();

	req.sanitize('first_name').escape();
	req.sanitize('family_name').escape();
	req.sanitize('first_name').trim();
	req.sanitize('family_name').trim();
	req.sanitize('date_of_birth').toDate();
	req.sanitize('date_of_death').toDate();

	//run error validators
	var errors = req.validationErrors();

	//creating author object with old id
	var author = new Author(
		{ 
		  first_name: req.body.first_name,
		  family_name: req.body.family_name,
		  date_of_birth: req.body.date_of_birth,
		  date_of_death: req.body.date_of_death,	
		  _id: req.params.id
		});
	
	if(errors) {
		async.parallel({
			author: function(callback) {
				Author.findById(req.body.authorid)
					.exec(callback);
			},
			authors_books: function(callback) {
				Book.find({ 'author': req.body.authorid }, 'title summary').exec(callback); 
			} 
		}, function(err, results) {
			if(err) { return next(err); }	
			res.render('author_form', { title: 'Update Author', author: author });
			res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books });
			return;
		});
	}
	else {
		Author.findByIdAndUpdate(req.params.id, author, {}, function (err, author ) {
			if(err) { return next(err); }
			//successful
			res.redirect(author.url);
		});
	}
};