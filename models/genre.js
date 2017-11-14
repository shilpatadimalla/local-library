var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = Schema({
	name: {type: String, required: true, min: 3, max: 100}
});

//virtual for genre url
GenreSchema
.virtual('url')
.get(function () {
	return '/catalog/genre/' + this._id;
});

//export genre model
module.exports = mongoose.model('Genre', GenreSchema);