var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = Schema(
	{
		first_name: {type:String, required: true, max: 100},
		family_name: {type: String, required: true, max: 100},
		date_of_birth: {type: Date},
		date_of_death: {type: Date}
	}
);

//virtual author fullname
AuthorSchema
.virtual('name')
.get(function() {
	return this.family_name + '.' + this.first_name;
});

//virtual author's url

AuthorSchema
.virtual('url')
.get(function() {
	return '/catalog/author/' + this._id;
});

//date_of_birth virtual
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function() {
	return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD'): '';
});

//date_of_death virtual
AuthorSchema
.virtual('date_of_death_formatted')
.get(function() {
	return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD'): '';
});

//export model
module.exports = mongoose.model('Author', AuthorSchema);